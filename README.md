# Никита Белосохов — Junior аналитик данных

**Сайт-портфолио:** https://deckkk491-creator.github.io/portfolio/ · **Резюме:** [PDF](resume/Belosokhov_data_analyst.pdf) · Москва, удалённо

Перехожу в аналитику данных из операционной работы рядом с руководителями: отчётность, закупки, учёт, продажи на маркетплейсах. Учусь на курсе «Аналитик данных» в Яндекс Практикуме.

## Проекты по анализу данных

| Проект | Вопрос бизнеса | Стек |
|---|---|---|
| [SQL-анализ продаж](projects/sql-marketplace/) | Какой канал реально зарабатывает, какие товары тянут вниз, возвращаются ли покупатели? | SQL: CTE, оконные функции, когорты, RFM, ABC |
| [A/B-тест карточки товара](projects/ab-test/) | Окупится ли видео в карточках или рост конверсии случаен? | Python, SciPy: размер выборки, SRM, z-тест, бутстреп |
| [Исследовательский анализ](projects/python-eda/) | Что происходит с продажами? Очистка грязной выгрузки и выводы | Python: pandas, NumPy, Matplotlib |
| [Юнит-экономика товара](projects/unit-economics/) · [демо](https://deckkk491-creator.github.io/portfolio/projects/unit-economics/) | Сколько приносит одна продажа и какую долю рекламы товар выдерживает | JavaScript |
| [Дашборд продаж](projects/sales-dashboard/) · [демо](https://deckkk491-creator.github.io/portfolio/projects/sales-dashboard/) | Выручка, заказы, чек и маржа по каналам и кварталам с выводами | JavaScript, SVG |
| [ABC-анализ из выгрузки](projects/abc-analysis/) · [демо](https://deckkk491-creator.github.io/portfolio/projects/abc-analysis/) | Загрузил CSV — получил группы A/B/C и таблицу для закупщика | JavaScript |
| [Дашборд в DataLens](projects/datalens/) | Данные и инструкция для дашборда в Yandex DataLens | DataLens |

Данные в проектах демонстрационные: генератор — [`data/generate.py`](data/generate.py), схема базы — [`data/schema.sql`](data/schema.sql). Реальные данные работодателей не публикуются.

## Кейсы из работы

- **Маркетплейсы (2023–2024):** анализ воронки и выдачи в MPSTATS → выручка +47% за 7 месяцев, ДРР 37% → 11%; единый шаблон главного фото → CTR 0,4% → 4,1%; учёт в «МойСклад» → поставка за 3 дня вместо 7.
- **«Движение Первых» (2024–2026):** автоматизация отчётности → 30 минут вместо 3 часов; контроль поручений → просрочка 30% → 3%; методика премирования с индексом оценки сотрудника.
- **Госучреждение (2022–2023):** закупки по 44-ФЗ на 30+ млн ₽ в год; регламент и типовые формы → согласование договора 2 дня вместо 7.

## Дополнительно: сайты

[Антикварная лавка «Ларец»](sites/antique-shop/) · [Цветочная мастерская «Мирт»](sites/flower-shop/) · [Кофейня «К», Тамбов](sites/coffee-k/)

## Как запустить аналитические проекты

```bash
python data/generate.py                          # база data/marketplace.db и CSV
python projects/sql-marketplace/run_queries.py   # SQL-запросы → README с результатами
jupyter notebook projects/                       # ноутбуки Python и A/B-теста
```

Нужны Python 3.10+, pandas, NumPy, SciPy, Matplotlib.

**Контакты:** +7 915 883-01-10 (телефон, Telegram) · deckkk@bk.ru
