# SQL-анализ продаж на маркетплейсах и сайте

**Задача.** Продавец товаров для дома за два года вырос на Wildberries, Ozon и своём сайте. Собственник спрашивает: «Мы растём, но куда вкладывать дальше? Какой канал реально зарабатывает, какие товары тянут вниз и возвращаются ли покупатели?»

**Что сделано.** 13 SQL-запросов к базе из 6 таблиц (24,6 тыс. заказов, 43 тыс. позиций, 15,5 тыс. покупателей, октябрь 2024 — сентябрь 2026). Внутри: JOIN нескольких таблиц, CTE, оконные функции (`LAG`, `SUM() OVER`, `ROW_NUMBER`, `NTILE`, `FIRST_VALUE`), когортный анализ, RFM-сегментация, ABC-анализ, юнит-экономика по каналам.

> Данные синтетические: я сгенерировал их скриптом [`data/generate.py`](../../data/generate.py), потому что реальные данные работодателей не публикую. В генератор заложены типичные закономерности маркетплейсов (сезонность, невыкуп, разная удерживаемость каналов, убыточные SKU). Запросы написаны так, будто данные реальные: на настоящей выгрузке они работают так же.

## Главное для руководителя

| # | Что нашёл | Что предлагаю |
|---|---|---|
| 1 | Выручка выросла на **45%** за год (38,9 → 56,6 млн ₽). Средний чек почти не изменился, весь рост дали новые покупатели (+44%). | Рост держится на привлечении, а не на удержании. Следующий резерв — повторные покупки (п. 4). |
| 2 | Wildberries даёт **45%** выручки, но только **27%** маржинальной прибыли. Сайт — 22% выручки и **39%** прибыли: маржинальность 33% против 11% на WB. | Растить долю сайта: вкладывать во вкладыш с промокодом на сайт в посылки маркетплейсов, рассылки, SEO. |
| 3 | Доля рекламных расходов упала с **28% до 12%**: на WB с 33% до 11,5%, на Ozon с 28% до 10%. На сайте ДРР все два года стоит на 13–14%. | Маркетплейсы оптимизированы. Теперь пересмотреть рекламу сайта: это единственный канал без улучшений. |
| 4 | Покупатель с сайта за первый год приносит **10,6 тыс. ₽**, с WB — **5,8 тыс. ₽** (в 1,8 раза меньше). Повторно покупают 71% против 38%. При этом удержание по когортам за два года не улучшилось (повтор за 6 мес ~35–37%). | Запустить программу удержания: триггерные письма через 30–40 дней (медиана до 2-го заказа на сайте — 40 дней), реактивацию «уходящих ценных» (13% базы, 19% выручки). |
| 5 | Текстиль на WB возвращают в **16,6%** случаев, в 1,3–1,4 раза чаще, чем на Ozon и сайте. Возвраты по всем категориям стоят ~0,9 млн ₽ одной логистики. | Проверить карточки текстиля на WB: размеры, реальные фото цвета, состав ткани. Это самый быстрый способ сэкономить. |
| 6 | **13 SKU** приносят меньше 100 ₽ с единицы ещё до рекламы, 3 из них — в минус. Это дешёвые товары, у которых логистика съедает маржу. | Поднять цену, продавать наборами (2–3 шт.) или убрать с маркетплейсов и оставить на сайте как допродажу. |

## Как запустить

```bash
python data/generate.py                          # создаёт data/marketplace.db и CSV
python projects/sql-marketplace/run_queries.py   # выполняет запросы и пересобирает этот README
```

Можно открыть `data/marketplace.db` в DBeaver или DB Browser for SQLite и выполнять запросы из [`queries.sql`](queries.sql) по одному. Схема таблиц — в [`data/schema.sql`](../../data/schema.sql).

**Метрики.** Чистая выручка — доставленные заказы без возвращённых позиций. Маржинальная прибыль = чистая выручка − себестоимость − комиссия площадки − логистика (за возврат платим дважды) − реклама. Финансовый год начинается 1 октября.

## Запросы

1. [Итоги двух лет](#1-итоги-двух-лет)
2. [Помесячная динамика и рост год к году](#2-помесячная-динамика-и-рост-год-к-году)
3. [Каналы продаж: объём и юнит-экономика](#3-каналы-продаж-объём-и-юнит-экономика)
4. [Доля рекламных расходов по кварталам](#4-доля-рекламных-расходов-по-кварталам)
5. [Убыточные и низкомаржинальные товары](#5-убыточные-и-низкомаржинальные-товары)
6. [ABC-анализ ассортимента](#6-abc-анализ-ассортимента)
7. [Возвраты по категориям и каналам](#7-возвраты-по-категориям-и-каналам)
8. [Когортный анализ: возвращаются ли покупатели](#8-когортный-анализ-возвращаются-ли-покупатели)
9. [Повторные покупки по каналу привлечения](#9-повторные-покупки-по-каналу-привлечения)
10. [LTV за 12 месяцев по каналу привлечения](#10-ltv-за-12-месяцев-по-каналу-привлечения)
11. [RFM-сегментация покупателей](#11-rfm-сегментация-покупателей)
12. [Промокоды на сайте](#12-промокоды-на-сайте)
13. [Пиковые дни](#13-пиковые-дни)

## 1. Итоги двух лет

**Вопрос.** как изменился бизнес год к году — выручка, заказы, покупатели, средний чек?

<details><summary>SQL-запрос</summary>

```sql
WITH o AS (
    SELECT o.order_id, o.customer_id,
           CASE WHEN o.order_date >= '2025-10-01' THEN 'FY2026' ELSE 'FY2025' END AS fy,
           SUM(oi.price * oi.quantity)                            AS gross,
           SUM(oi.price * oi.quantity * (1 - oi.is_returned))     AS net
    FROM orders o
    JOIN order_items oi USING (order_id)
    WHERE o.status = 'delivered'
    GROUP BY o.order_id
)
SELECT fy                                   AS "год",
       ROUND(SUM(net) / 1e6, 2)             AS "чистая выручка, млн ₽",
       COUNT(*)                             AS "заказы",
       COUNT(DISTINCT customer_id)          AS "покупатели",
       ROUND(SUM(net) / COUNT(*))           AS "средний чек, ₽",
       ROUND(100.0 * (1 - SUM(net) / SUM(gross)), 1) AS "потери на возвратах, %"
FROM o
GROUP BY fy
ORDER BY fy;
```

</details>

| год | чистая выручка, млн ₽ | заказы | покупатели | средний чек, ₽ | потери на возвратах, % |
|---|---:|---:|---:|---:|---:|
| FY2025 | 38,92 | 9 549 | 6 465 | 4 076 | 8,7 |
| FY2026 | 56,6 | 13 707 | 9 294 | 4 129 | 8,8 |

**Вывод.** Чистая выручка выросла на 45%, заказы — на 44%, покупатели — на 44%. Средний чек почти не изменился (+1%), значит, рост дало привлечение новых покупателей, а не рост чека или частоты. Потери на возвратах стабильны: около 9% выручки.

## 2. Помесячная динамика и рост год к году

**Вопрос.** есть ли рост в каждом месяце или он держится только на сезонных пиках?

<details><summary>SQL-запрос</summary>

```sql
WITH m AS (
    SELECT strftime('%Y-%m', o.order_date) AS month,
           SUM(oi.price * oi.quantity * (1 - oi.is_returned)) AS net
    FROM orders o
    JOIN order_items oi USING (order_id)
    WHERE o.status = 'delivered'
    GROUP BY month
)
SELECT month                                                   AS "месяц",
       ROUND(net / 1e3)                                        AS "выручка, тыс ₽",
       ROUND(100.0 * (net / LAG(net, 1)  OVER w - 1), 1)       AS "к пред. месяцу, %",
       ROUND(100.0 * (net / LAG(net, 12) OVER w - 1), 1)       AS "к году назад, %"
FROM m
WINDOW w AS (ORDER BY month)
ORDER BY month DESC
LIMIT 12;
```

</details>

| месяц | выручка, тыс ₽ | к пред. месяцу, % | к году назад, % |
|---|---:|---:|---:|
| 2026-09 | 4 823 | 5,4 | 31,2 |
| 2026-08 | 4 574 | 11,7 | 35,2 |
| 2026-07 | 4 095 | 0,8 | 34,5 |
| 2026-06 | 4 062 | -9,1 | 43,8 |
| 2026-05 | 4 468 | 1,8 | 39 |
| 2026-04 | 4 389 | -13,3 | 46,8 |
| 2026-03 | 5 065 | 24,9 | 30,2 |
| 2026-02 | 4 055 | -12,1 | 31,9 |
| 2026-01 | 4 613 | -34,8 | 53,2 |
| 2025-12 | 7 071 | 32,7 | 59,8 |
| 2025-11 | 5 328 | 31,4 | 65,9 |
| 2025-10 | 4 054 | 10,3 | 86,6 |

**Вывод.** Рост к прошлому году есть в каждом из 12 месяцев: от +30% до +87%. Он не держится только на сезонных пиках. Высокие проценты осенью 2025 года частично объясняются низкой базой: в октябре 2024 магазин только запускался. Корректнее смотреть на весну и лето 2026: стабильные +30–45%.

## 3. Каналы продаж: объём и юнит-экономика

**Вопрос.** какой канал приносит больше денег после всех расходов, а не только больше выручки?

<details><summary>SQL-запрос</summary>

```sql
WITH item_costs AS (
    SELECT o.channel,
           oi.price * oi.quantity * (1 - oi.is_returned)                    AS net,
           p.cost_price * oi.quantity * (1 - oi.is_returned)                AS cogs,
           oi.price * oi.quantity * (1 - oi.is_returned) * c.commission_rate AS commission,
           c.logistics_per_item * oi.quantity * (1 + oi.is_returned)        AS logistics
    FROM orders o
    JOIN order_items oi USING (order_id)
    JOIN products p     USING (product_id)
    JOIN channels c     ON c.channel = o.channel
    WHERE o.status = 'delivered'
),
by_channel AS (
    SELECT channel, SUM(net) net, SUM(cogs) cogs, SUM(commission) commission, SUM(logistics) logistics
    FROM item_costs GROUP BY channel
),
ads AS (
    SELECT channel, SUM(spend) AS ads FROM marketing_spend GROUP BY channel
)
SELECT b.channel                                                       AS "канал",
       ROUND(b.net / 1e6, 2)                                           AS "выручка, млн ₽",
       ROUND(100.0 * b.net / SUM(b.net) OVER (), 1)                    AS "доля выручки, %",
       ROUND(100.0 * a.ads / b.net, 1)                                 AS "ДРР, %",
       ROUND((b.net - b.cogs - b.commission - b.logistics - a.ads) / 1e6, 2) AS "маржинальная прибыль, млн ₽",
       ROUND(100.0 * (b.net - b.cogs - b.commission - b.logistics - a.ads) / b.net, 1) AS "маржинальность, %"
FROM by_channel b
JOIN ads a USING (channel)
ORDER BY "маржинальная прибыль, млн ₽" DESC;
```

</details>

| канал | выручка, млн ₽ | доля выручки, % | ДРР, % | маржинальная прибыль, млн ₽ | маржинальность, % |
|---|---:|---:|---:|---:|---:|
| Сайт | 21,13 | 22,1 | 13,7 | 6,98 | 33 |
| Ozon | 31,28 | 32,7 | 15,3 | 5,99 | 19,1 |
| Wildberries | 43,11 | 45,1 | 19,4 | 4,84 | 11,2 |

**Вывод.** По выручке лидирует Wildberries, по прибыли — сайт. На сайте нет комиссии площадки, а реклама дешевле, поэтому каждый рубль выручки там приносит в 3 раза больше прибыли, чем на WB (33% против 11%). Это не значит, что WB надо закрывать: он даёт поток новых покупателей. Но часть повторных покупок выгодно переводить на сайт.

## 4. Доля рекламных расходов по кварталам

**Вопрос.** становится ли реклама эффективнее со временем?

<details><summary>SQL-запрос</summary>

```sql
WITH rev AS (
    SELECT o.channel,
           strftime('%Y', o.order_date) || '-Q' || ((CAST(strftime('%m', o.order_date) AS INT) + 2) / 3) AS q,
           SUM(oi.price * oi.quantity * (1 - oi.is_returned)) AS net
    FROM orders o JOIN order_items oi USING (order_id)
    WHERE o.status = 'delivered'
    GROUP BY 1, 2
),
ads AS (
    SELECT channel,
           strftime('%Y', date) || '-Q' || ((CAST(strftime('%m', date) AS INT) + 2) / 3) AS q,
           SUM(spend) AS spend
    FROM marketing_spend GROUP BY 1, 2
)
SELECT r.q AS "квартал",
       ROUND(100.0 * SUM(CASE WHEN r.channel = 'Wildberries' THEN a.spend END) / SUM(CASE WHEN r.channel = 'Wildberries' THEN r.net END), 1) AS "ДРР WB, %",
       ROUND(100.0 * SUM(CASE WHEN r.channel = 'Ozon'        THEN a.spend END) / SUM(CASE WHEN r.channel = 'Ozon'        THEN r.net END), 1) AS "ДРР Ozon, %",
       ROUND(100.0 * SUM(CASE WHEN r.channel = 'Сайт'        THEN a.spend END) / SUM(CASE WHEN r.channel = 'Сайт'        THEN r.net END), 1) AS "ДРР сайт, %",
       ROUND(100.0 * SUM(a.spend) / SUM(r.net), 1) AS "ДРР всего, %"
FROM rev r
JOIN ads a ON a.channel = r.channel AND a.q = r.q
GROUP BY r.q
ORDER BY r.q;
```

</details>

| квартал | ДРР WB, % | ДРР Ozon, % | ДРР сайт, % | ДРР всего, % |
|---|---:|---:|---:|---:|
| 2024-Q4 | 33,3 | 27,8 | 16,2 | 28,3 |
| 2025-Q1 | 29,4 | 23,9 | 13,2 | 24 |
| 2025-Q2 | 26,5 | 20,5 | 13,8 | 21,8 |
| 2025-Q3 | 21,1 | 16 | 13,7 | 17,8 |
| 2025-Q4 | 16,8 | 11,4 | 13,3 | 14,3 |
| 2026-Q1 | 13,3 | 10,4 | 13,3 | 12,4 |
| 2026-Q2 | 12,1 | 10,2 | 13,5 | 11,8 |
| 2026-Q3 | 11,5 | 10,2 | 13,7 | 11,6 |

**Вывод.** За два года ДРР снизилась в 2,4 раза: с 28,3% до 11,6%. Почти весь эффект дали маркетплейсы, с 2026 года снижение замедлилось (11,5–13%), то есть простые улучшения исчерпаны. На сайте ДРР не менялась: эту рекламу никто не оптимизировал.

## 5. Убыточные и низкомаржинальные товары

**Вопрос.** какие SKU продаются, но после комиссии, логистики и возвратов почти ничего не приносят (меньше 100 ₽ с единицы ещё до рекламы)?

<details><summary>SQL-запрос</summary>

```sql
WITH sku AS (
    SELECT p.sku, p.name, p.category,
           SUM(oi.quantity * (1 - oi.is_returned))                                  AS sold_units,
           SUM(oi.price * oi.quantity * (1 - oi.is_returned))                       AS net,
           SUM(oi.price * oi.quantity * (1 - oi.is_returned) * (1 - c.commission_rate)
               - p.cost_price * oi.quantity * (1 - oi.is_returned)
               - c.logistics_per_item * oi.quantity * (1 + oi.is_returned))         AS profit_before_ads
    FROM orders o
    JOIN order_items oi USING (order_id)
    JOIN products p     USING (product_id)
    JOIN channels c     ON c.channel = o.channel
    WHERE o.status = 'delivered'
    GROUP BY p.product_id
)
SELECT sku AS "SKU", name AS "товар", category AS "категория",
       sold_units AS "продано, шт",
       ROUND(net / sold_units) AS "ср. цена, ₽",
       ROUND(profit_before_ads / sold_units) AS "прибыль до рекламы на 1 шт, ₽",
       ROUND(profit_before_ads / 1e3) AS "итого, тыс ₽"
FROM sku
WHERE profit_before_ads / sold_units < 100
ORDER BY profit_before_ads / sold_units;
```

</details>

| SKU | товар | категория | продано, шт | ср. цена, ₽ | прибыль до рекламы на 1 шт, ₽ | итого, тыс ₽ |
|---|---|---|---:|---:|---:|---:|
| DU-0099 | Держатель для щёток (графит) | Ванная | 269 | 330 | -44 | -12 |
| DU-0057 | Вакуумные пакеты | Хранение | 220 | 294 | -40 | -9 |
| DU-0060 | Кофр для одежды | Хранение | 66 | 472 | -7 | 0 |
| DU-0103 | Корзина для белья (оливковый) | Ванная | 318 | 546 | 8 | 3 |
| DU-0051 | Корзина плетёная (графит) | Хранение | 243 | 548 | 17 | 4 |
| DU-0066 | Короб с крышкой (серый) | Хранение | 36 | 549 | 32 | 1 |
| DU-0097 | Держатель для щёток (белый) | Ванная | 960 | 624 | 47 | 46 |
| DU-0068 | Свеча ароматическая (белый) | Декор | 1 890 | 479 | 63 | 118 |
| DU-0065 | Полка навесная (белый) | Хранение | 506 | 381 | 67 | 34 |
| DU-0098 | Держатель для щёток | Ванная | 118 | 637 | 82 | 10 |
| DU-0047 | Форма для запекания (оливковый) | Посуда | 23 | 646 | 89 | 2 |
| DU-0052 | Корзина плетёная (бежевый) | Хранение | 996 | 519 | 95 | 95 |
| DU-0049 | Органайзер для ящика (оливковый) | Хранение | 110 | 623 | 99 | 11 |

**Вывод.** Все 13 товаров — дешёвые позиции (300–650 ₽), где фиксированная логистика 85–160 ₽ за штуку и комиссия съедают маржу. Три SKU работают в минус ещё до рекламы. «Свеча ароматическая (белый)» и «Корзина плетёная (бежевый)» продаются тысячами штук: при такой экономике каждая продажа почти ничего не приносит, а реклама делает их убыточными. Варианты: поднять цену на 10–15%, продавать наборами или оставить только на сайте как допродажу к заказу.

## 6. ABC-анализ ассортимента

**Вопрос.** сколько SKU дают 80% выручки и сколько товаров «висят» на складе?

<details><summary>SQL-запрос</summary>

```sql
WITH sku AS (
    SELECT oi.product_id, SUM(oi.price * oi.quantity * (1 - oi.is_returned)) AS net
    FROM orders o JOIN order_items oi USING (order_id)
    WHERE o.status = 'delivered'
    GROUP BY oi.product_id
),
ranked AS (
    SELECT product_id, net,
           SUM(net) OVER (ORDER BY net DESC ROWS UNBOUNDED PRECEDING) / SUM(net) OVER () AS cum_share
    FROM sku
),
abc AS (
    SELECT *, CASE WHEN cum_share <= 0.80 THEN 'A' WHEN cum_share <= 0.95 THEN 'B' ELSE 'C' END AS grp
    FROM ranked
)
SELECT grp AS "группа",
       COUNT(*) AS "SKU",
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS "доля SKU, %",
       ROUND(100.0 * SUM(net) / SUM(SUM(net)) OVER (), 1) AS "доля выручки, %"
FROM abc
GROUP BY grp
ORDER BY grp;
```

</details>

| группа | SKU | доля SKU, % | доля выручки, % |
|---|---:|---:|---:|
| A | 26 | 24,8 | 79,7 |
| B | 31 | 29,5 | 15,2 |
| C | 48 | 45,7 | 5,1 |

**Вывод.** Классическая картина Парето: 25% ассортимента дают 80% выручки. 48 SKU группы C (почти половина ассортимента) приносят 5% выручки, но занимают место на складе и требуют оборачиваемости. Их стоит проверить на остатки и решить, что выводить. Подробнее — в [интерактивном ABC-анализе](../abc-analysis/).

## 7. Возвраты по категориям и каналам

**Вопрос.** где возвраты выше нормы и сколько это стоит в логистике?

<details><summary>SQL-запрос</summary>

```sql
SELECT p.category AS "категория",
       ROUND(100.0 * SUM(CASE WHEN o.channel = 'Wildberries' THEN oi.is_returned * oi.quantity END) / SUM(CASE WHEN o.channel = 'Wildberries' THEN oi.quantity END), 1) AS "возвраты WB, %",
       ROUND(100.0 * SUM(CASE WHEN o.channel = 'Ozon'        THEN oi.is_returned * oi.quantity END) / SUM(CASE WHEN o.channel = 'Ozon'        THEN oi.quantity END), 1) AS "возвраты Ozon, %",
       ROUND(100.0 * SUM(CASE WHEN o.channel = 'Сайт'        THEN oi.is_returned * oi.quantity END) / SUM(CASE WHEN o.channel = 'Сайт'        THEN oi.quantity END), 1) AS "возвраты сайт, %",
       ROUND(SUM(oi.is_returned * oi.quantity * 2 * c.logistics_per_item) / 1e3) AS "логистика возвратов, тыс ₽"
FROM orders o
JOIN order_items oi USING (order_id)
JOIN products p     USING (product_id)
JOIN channels c     ON c.channel = o.channel
WHERE o.status = 'delivered'
GROUP BY p.category
ORDER BY "логистика возвратов, тыс ₽" DESC;
```

</details>

| категория | возвраты WB, % | возвраты Ozon, % | возвраты сайт, % | логистика возвратов, тыс ₽ |
|---|---:|---:|---:|---:|
| Текстиль | 16,6 | 12,9 | 11,7 | 281 |
| Посуда | 8,9 | 5,1 | 4,6 | 220 |
| Ванная | 10,8 | 7,1 | 6,8 | 181 |
| Декор | 9,9 | 5,5 | 5,4 | 156 |
| Хранение | 7 | 3,8 | 3,7 | 47 |

**Вывод.** Текстиль — главная проблема с возвратами во всех каналах, но на WB особенно: 16,6%. Возвраты всех категорий на WB в 1,4–1,9 раза выше, чем на сайте. Логистика возвратов обошлась почти в 0,9 млн ₽, и это без учёта потерянной маржи и испорченного товара.

## 8. Когортный анализ: возвращаются ли покупатели

**Вопрос.** какая доля новых покупателей делает повторный заказ в следующие месяцы?

<details><summary>SQL-запрос</summary>

```sql
WITH first AS (
    SELECT customer_id, MIN(order_date) AS first_date
    FROM orders WHERE status = 'delivered'
    GROUP BY customer_id
),
activity AS (
    SELECT f.customer_id,
           strftime('%Y-%m', f.first_date) AS cohort,
           (CAST(strftime('%Y', o.order_date) AS INT) - CAST(strftime('%Y', f.first_date) AS INT)) * 12
         + (CAST(strftime('%m', o.order_date) AS INT) - CAST(strftime('%m', f.first_date) AS INT)) AS month_n
    FROM first f
    JOIN orders o ON o.customer_id = f.customer_id AND o.status = 'delivered'
),
sizes AS (SELECT cohort, COUNT(DISTINCT customer_id) AS n FROM activity WHERE month_n = 0 GROUP BY cohort)
SELECT a.cohort AS "когорта",
       s.n AS "новых",
       ROUND(100.0 * COUNT(DISTINCT CASE WHEN month_n = 1 THEN a.customer_id END) / s.n, 1) AS "M1, %",
       ROUND(100.0 * COUNT(DISTINCT CASE WHEN month_n = 2 THEN a.customer_id END) / s.n, 1) AS "M2, %",
       ROUND(100.0 * COUNT(DISTINCT CASE WHEN month_n = 3 THEN a.customer_id END) / s.n, 1) AS "M3, %",
       ROUND(100.0 * COUNT(DISTINCT CASE WHEN month_n = 6 THEN a.customer_id END) / s.n, 1) AS "M6, %",
       ROUND(100.0 * COUNT(DISTINCT CASE WHEN month_n BETWEEN 1 AND 6 THEN a.customer_id END) / s.n, 1) AS "любой повтор за 6 мес, %"
FROM activity a
JOIN sizes s USING (cohort)
WHERE a.cohort BETWEEN '2024-10' AND '2026-03'          -- у когорт есть полные 6 месяцев наблюдения
GROUP BY a.cohort
ORDER BY a.cohort;
```

</details>

| когорта | новых | M1, % | M2, % | M3, % | M6, % | любой повтор за 6 мес, % |
|---|---:|---:|---:|---:|---:|---:|
| 2024-10 | 455 | 13 | 8,1 | 7,3 | 2,6 | 34,7 |
| 2024-11 | 694 | 13,7 | 9,8 | 8,8 | 2,2 | 36 |
| 2024-12 | 839 | 13,8 | 9,7 | 7,7 | 3,1 | 37,3 |
| 2025-01 | 455 | 13,8 | 11,4 | 7,9 | 2,6 | 34,1 |
| 2025-02 | 444 | 13,1 | 9,5 | 5,9 | 3,4 | 35,1 |
| 2025-03 | 611 | 12,9 | 10,3 | 6,7 | 1,8 | 36,7 |
| 2025-04 | 477 | 14 | 8,8 | 7,3 | 2,7 | 34,4 |
| 2025-05 | 469 | 11,9 | 7,9 | 7,5 | 2,3 | 32 |
| 2025-06 | 451 | 13,5 | 9,5 | 8,6 | 2 | 37,3 |
| 2025-07 | 474 | 16,7 | 8,9 | 8,6 | 2,5 | 39 |
| 2025-08 | 483 | 16,4 | 11,4 | 7,2 | 2,9 | 39,3 |
| 2025-09 | 613 | 14,4 | 11,4 | 7,5 | 2 | 36,1 |
| 2025-10 | 635 | 13,2 | 10,4 | 8,2 | 3,5 | 35,6 |
| 2025-11 | 982 | 14,5 | 11,8 | 6,9 | 3,4 | 37,3 |
| 2025-12 | 1 168 | 14,5 | 9,2 | 7,5 | 2,7 | 35,5 |
| 2026-01 | 603 | 14,1 | 10,4 | 8,3 | 2 | 37 |
| 2026-02 | 579 | 14 | 8,8 | 7,3 | 2,6 | 34,2 |
| 2026-03 | 779 | 15,1 | 9,2 | 7,4 | 2,3 | 35,4 |

**Вывод.** Удержание стабильно, но не растёт: 13–17% новичков возвращаются в следующем месяце, около 35–37% делают повторный заказ за полгода. Когорты 2026 года ведут себя так же, как когорты 2024-го, то есть удержанием никто системно не занимался. Это резерв: если поднять повторные покупки на 5 п.п., выручка вырастет без роста рекламы.

## 9. Повторные покупки по каналу привлечения

**Вопрос.** из какого канала приходят покупатели, которые возвращаются, и через сколько дней?

<details><summary>SQL-запрос</summary>

```sql
WITH seq AS (
    SELECT o.customer_id, o.order_date,
           ROW_NUMBER() OVER (PARTITION BY o.customer_id ORDER BY o.order_date, o.order_id) AS n,
           FIRST_VALUE(o.channel) OVER (PARTITION BY o.customer_id ORDER BY o.order_date, o.order_id) AS acq_channel
    FROM orders o
    WHERE o.status = 'delivered'
),
pairs AS (
    SELECT s1.customer_id, s1.acq_channel,
           julianday(s2.order_date) - julianday(s1.order_date) AS days_to_2nd
    FROM seq s1
    LEFT JOIN seq s2 ON s2.customer_id = s1.customer_id AND s2.n = 2
    WHERE s1.n = 1 AND s1.order_date < '2026-04-01'     -- оставляем полгода на повторную покупку
),
ranked AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY acq_channel ORDER BY days_to_2nd) AS rn,
              COUNT(days_to_2nd) OVER (PARTITION BY acq_channel) AS cnt
    FROM pairs WHERE days_to_2nd IS NOT NULL
)
SELECT p.acq_channel AS "канал первой покупки",
       COUNT(*) AS "покупателей",
       ROUND(100.0 * COUNT(p.days_to_2nd) / COUNT(*), 1) AS "сделали 2-й заказ, %",
       (SELECT CAST(days_to_2nd AS INT) FROM ranked r WHERE r.acq_channel = p.acq_channel AND r.rn = (r.cnt + 1) / 2) AS "медиана дней до 2-го заказа"
FROM pairs p
GROUP BY p.acq_channel
ORDER BY "сделали 2-й заказ, %" DESC;
```

</details>

| канал первой покупки | покупателей | сделали 2-й заказ, % | медиана дней до 2-го заказа |
|---|---:|---:|---:|
| Сайт | 1 561 | 71,2 | 40 |
| Ozon | 3 856 | 44,2 | 47 |
| Wildberries | 5 794 | 38,4 | 50 |

**Вывод.** Покупатели, пришедшие через сайт, возвращаются почти вдвое чаще (71% против 38% у WB) и быстрее: медиана — 40 дней до второго заказа. Это удобный момент для триггерной рассылки: напоминание с подборкой на 30–35-й день после покупки.

## 10. LTV за 12 месяцев по каналу привлечения

**Вопрос.** сколько чистой выручки приносит покупатель за первый год в зависимости от канала?

<details><summary>SQL-запрос</summary>

```sql
WITH first AS (
    SELECT customer_id, MIN(order_date) AS first_date
    FROM orders WHERE status = 'delivered' GROUP BY customer_id
),
acq AS (
    SELECT f.customer_id, f.first_date,
           (SELECT o.channel FROM orders o WHERE o.customer_id = f.customer_id AND o.status = 'delivered'
            ORDER BY o.order_date, o.order_id LIMIT 1) AS acq_channel
    FROM first f
    WHERE f.first_date < '2025-10-01'                   -- у этих покупателей прошло ≥ 12 месяцев
),
rev AS (
    SELECT a.customer_id, a.acq_channel,
           SUM(oi.price * oi.quantity * (1 - oi.is_returned)) AS net,
           COUNT(DISTINCT o.order_id) AS orders
    FROM acq a
    JOIN orders o       ON o.customer_id = a.customer_id AND o.status = 'delivered'
                       AND o.order_date < date(a.first_date, '+12 months')
    JOIN order_items oi ON oi.order_id = o.order_id
    GROUP BY a.customer_id
)
SELECT acq_channel AS "канал привлечения",
       COUNT(*) AS "покупателей",
       ROUND(AVG(orders), 2) AS "заказов на покупателя",
       ROUND(AVG(net)) AS "LTV 12 мес, ₽ (выручка)"
FROM rev
GROUP BY acq_channel
ORDER BY "LTV 12 мес, ₽ (выручка)" DESC;
```

</details>

| канал привлечения | покупателей | заказов на покупателя | LTV 12 мес, ₽ (выручка) |
|---|---:|---:|---:|
| Сайт | 891 | 2,21 | 10 621 |
| Ozon | 2 246 | 1,58 | 6 241 |
| Wildberries | 3 328 | 1,5 | 5 794 |

**Вывод.** LTV за первый год у покупателя с сайта — 10,6 тыс. ₽, почти вдвое больше, чем у WB и Ozon. Значит, на привлечение покупателя на сайт можно тратить больше. Если стоимость привлечения на сайте ниже ~3,5 тыс. ₽ (треть LTV), канал окупается с запасом.

## 11. RFM-сегментация покупателей

**Вопрос.** кого удерживать в первую очередь и кого пора «будить» рассылкой?

<details><summary>SQL-запрос</summary>

```sql
WITH base AS (
    SELECT o.customer_id,
           julianday('2026-09-30') - julianday(MAX(o.order_date)) AS recency,
           COUNT(DISTINCT o.order_id)                              AS frequency,
           SUM(oi.price * oi.quantity * (1 - oi.is_returned))      AS monetary
    FROM orders o JOIN order_items oi USING (order_id)
    WHERE o.status = 'delivered'
    GROUP BY o.customer_id
),
scored AS (
    SELECT *,
           NTILE(3) OVER (ORDER BY recency DESC) AS r,       -- 3 — покупал недавно
           CASE WHEN frequency >= 3 THEN 3 WHEN frequency = 2 THEN 2 ELSE 1 END AS f,
           NTILE(3) OVER (ORDER BY monetary)     AS m
    FROM base
),
seg AS (
    SELECT *, CASE
        WHEN r = 3 AND f >= 2 AND m = 3 THEN '1. Лучшие'
        WHEN r >= 2 AND f >= 2           THEN '2. Лояльные'
        WHEN r = 3 AND f = 1             THEN '3. Новички'
        WHEN r = 1 AND f >= 2            THEN '4. Уходящие ценные'
        WHEN r = 2 AND f = 1             THEN '5. Засыпающие'
        ELSE                                  '6. Потерянные'
    END AS segment
    FROM scored
)
SELECT segment AS "сегмент",
       COUNT(*) AS "покупателей",
       ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS "доля, %",
       ROUND(100.0 * SUM(monetary) / SUM(SUM(monetary)) OVER (), 1) AS "доля выручки, %",
       CAST(AVG(recency) AS INT) AS "дней с последнего заказа"
FROM seg
GROUP BY segment
ORDER BY segment;
```

</details>

| сегмент | покупателей | доля, % | доля выручки, % | дней с последнего заказа |
|---|---:|---:|---:|---:|
| 1. Лучшие | 1 413 | 9,4 | 19,5 | 93 |
| 2. Лояльные | 2 827 | 18,8 | 24,5 | 236 |
| 3. Новички | 2 810 | 18,7 | 11,9 | 83 |
| 4. Уходящие ценные | 1 903 | 12,7 | 18,8 | 541 |
| 5. Засыпающие | 2 952 | 19,7 | 12,4 | 294 |
| 6. Потерянные | 3 098 | 20,6 | 12,9 | 576 |

**Вывод.** «Уходящие ценные» — 13% покупателей, которые принесли 19% выручки, но не покупали в среднем полтора года. Это первая цель для реактивации: письмо или SMS с персональной подборкой. «Лучшие» (9% базы, 20% выручки) — кандидаты в программу лояльности и ранний доступ к новинкам.

## 12. Промокоды на сайте

**Вопрос.** приводят ли промокоды покупателей, которые возвращаются, или только снижают чек?

<details><summary>SQL-запрос</summary>

```sql
WITH o AS (
    SELECT o.order_id, o.customer_id, o.promo_code,
           ROW_NUMBER() OVER (PARTITION BY o.customer_id ORDER BY o.order_date, o.order_id) AS n,
           SUM(oi.price * oi.quantity * (1 - oi.is_returned)) AS net
    FROM orders o JOIN order_items oi USING (order_id)
    WHERE o.status = 'delivered' AND o.channel = 'Сайт'
    GROUP BY o.order_id
),
first_orders AS (
    SELECT o.*, EXISTS (SELECT 1 FROM orders o2 WHERE o2.customer_id = o.customer_id
                        AND o2.status = 'delivered' AND o2.order_id <> o.order_id) AS came_back
    FROM o WHERE n = 1
)
SELECT COALESCE(promo_code, 'без промокода') AS "первый заказ",
       COUNT(*) AS "заказов",
       ROUND(AVG(net)) AS "средний чек, ₽",
       ROUND(100.0 * AVG(came_back), 1) AS "вернулись за повторной покупкой, %"
FROM first_orders
GROUP BY 1
ORDER BY "заказов" DESC;
```

</details>

| первый заказ | заказов | средний чек, ₽ | вернулись за повторной покупкой, % |
|---|---:|---:|---:|
| без промокода | 1 879 | 5 343 | 68,2 |
| WELCOME10 | 266 | 4 965 | 70,7 |
| DOM15 | 165 | 4 834 | 74,5 |
| AUTUMN | 107 | 4 550 | 71 |

**Вывод.** Промокод снижает средний чек первого заказа на 7–15%. Покупатели с промокодом возвращаются чуть чаще (71–75% против 68%), но выборки маленькие (107–266 заказов), и разница в 3–6 п.п. может быть случайной. Корректно проверить эффект промокода можно только A/B-тестом. Пример такого теста — в [проекте A/B-теста](../ab-test/).

## 13. Пиковые дни

**Вопрос.** в какие дни нагрузка на склад максимальна и к чему готовиться?

<details><summary>SQL-запрос</summary>

```sql
WITH d AS (
    SELECT o.order_date,
           COUNT(DISTINCT o.order_id) AS orders,
           SUM(oi.quantity) AS units,
           SUM(oi.price * oi.quantity * (1 - oi.is_returned)) AS net
    FROM orders o JOIN order_items oi USING (order_id)
    WHERE o.status = 'delivered'
    GROUP BY o.order_date
)
SELECT order_date AS "дата",
       orders AS "заказов",
       units AS "единиц к отгрузке",
       ROUND(net / 1e3) AS "выручка, тыс ₽",
       ROUND(1.0 * units / AVG(units) OVER (), 1) AS "× к среднему дню"
FROM d
ORDER BY units DESC
LIMIT 10;
```

</details>

| дата | заказов | единиц к отгрузке | выручка, тыс ₽ | × к среднему дню |
|---|---:|---:|---:|---:|
| 2025-12-28 | 70 | 172 | 295 | 2,5 |
| 2025-12-24 | 61 | 149 | 281 | 2,1 |
| 2025-11-08 | 61 | 143 | 215 | 2,1 |
| 2025-11-12 | 67 | 141 | 225 | 2 |
| 2025-12-25 | 65 | 141 | 261 | 2 |
| 2025-11-15 | 59 | 140 | 262 | 2 |
| 2025-12-19 | 58 | 140 | 251 | 2 |
| 2025-12-13 | 65 | 139 | 281 | 2 |
| 2025-12-17 | 66 | 139 | 274 | 2 |
| 2025-12-08 | 57 | 134 | 244 | 1,9 |

**Вывод.** Пиковая нагрузка приходится не на распродажу 11.11, а на вторую половину декабря: новогодние подарки дают до 2,5 средних дней по отгрузкам. К 1 декабря стоит довезти запасы группы A на склады маркетплейсов и договориться о дополнительных сборщиках на 10–28 декабря.

