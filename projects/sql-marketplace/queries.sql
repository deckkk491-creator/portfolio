-- Анализ продаж продавца товаров для дома на Wildberries, Ozon и собственном сайте.
-- СУБД: SQLite 3.45 (оконные функции, CTE). База: data/marketplace.db
-- Каждый блок начинается с «-- @N Заголовок» и строки «-- Вопрос: …».
--
-- Договорённости по метрикам:
--   выручка (gross)      — сумма price × quantity по доставленным заказам;
--   чистая выручка (net) — то же без возвращённых позиций;
--   маржинальная прибыль — net − себестоимость − комиссия − логистика − реклама;
--   логистика платится за каждую отправленную единицу, за возврат — ещё раз (обратный путь);
--   финансовый год продавца начинается 1 октября: FY2025 = окт 2024 — сен 2025.


-- @1 Итоги двух лет
-- Вопрос: как изменился бизнес год к году — выручка, заказы, покупатели, средний чек?
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


-- @2 Помесячная динамика и рост год к году
-- Вопрос: есть ли рост в каждом месяце или он держится только на сезонных пиках?
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


-- @3 Каналы продаж: объём и юнит-экономика
-- Вопрос: какой канал приносит больше денег после всех расходов, а не только больше выручки?
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


-- @4 Доля рекламных расходов по кварталам
-- Вопрос: становится ли реклама эффективнее со временем?
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


-- @5 Убыточные и низкомаржинальные товары
-- Вопрос: какие SKU продаются, но после комиссии, логистики и возвратов почти ничего не приносят (меньше 100 ₽ с единицы ещё до рекламы)?
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


-- @6 ABC-анализ ассортимента
-- Вопрос: сколько SKU дают 80% выручки и сколько товаров «висят» на складе?
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


-- @7 Возвраты по категориям и каналам
-- Вопрос: где возвраты выше нормы и сколько это стоит в логистике?
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


-- @8 Когортный анализ: возвращаются ли покупатели
-- Вопрос: какая доля новых покупателей делает повторный заказ в следующие месяцы?
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


-- @9 Повторные покупки по каналу привлечения
-- Вопрос: из какого канала приходят покупатели, которые возвращаются, и через сколько дней?
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


-- @10 LTV за 12 месяцев по каналу привлечения
-- Вопрос: сколько чистой выручки приносит покупатель за первый год в зависимости от канала?
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


-- @11 RFM-сегментация покупателей
-- Вопрос: кого удерживать в первую очередь и кого пора «будить» рассылкой?
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


-- @12 Промокоды на сайте
-- Вопрос: приводят ли промокоды покупателей, которые возвращаются, или только снижают чек?
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


-- @13 Пиковые дни
-- Вопрос: в какие дни нагрузка на склад максимальна и к чему готовиться?
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
