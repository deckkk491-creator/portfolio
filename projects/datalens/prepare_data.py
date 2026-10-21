"""
Готовит плоские таблицы для загрузки в Yandex DataLens (подключение «Файлы»).
Запуск из корня репозитория: python projects/datalens/prepare_data.py
"""
from pathlib import Path
import sqlite3
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
con = sqlite3.connect(ROOT / "data" / "marketplace.db")

sales = pd.read_sql_query("""
    WITH first AS (SELECT customer_id, MIN(order_id) AS first_order FROM orders WHERE status = 'delivered' GROUP BY customer_id)
    SELECT o.order_date                                            AS "Дата",
           o.order_id                                              AS "Заказ",
           o.customer_id                                           AS "Покупатель",
           CASE WHEN o.order_id = f.first_order THEN 'Новый' ELSE 'Повторный' END AS "Тип покупателя",
           o.channel                                               AS "Канал",
           cu.city                                                 AS "Город",
           p.category                                              AS "Категория",
           p.sku                                                   AS "SKU",
           p.name                                                  AS "Товар",
           oi.quantity                                             AS "Количество",
           oi.is_returned                                          AS "Возврат",
           ROUND(oi.price * oi.quantity * (1 - oi.is_returned), 2) AS "Выручка",
           ROUND(p.cost_price * oi.quantity * (1 - oi.is_returned), 2) AS "Себестоимость",
           ROUND(oi.price * oi.quantity * (1 - oi.is_returned) * c.commission_rate, 2) AS "Комиссия",
           ROUND(c.logistics_per_item * oi.quantity * (1 + oi.is_returned), 2) AS "Логистика"
    FROM orders o
    JOIN order_items oi USING (order_id)
    JOIN products p USING (product_id)
    JOIN channels c ON c.channel = o.channel
    JOIN customers cu ON cu.customer_id = o.customer_id
    LEFT JOIN first f ON f.customer_id = o.customer_id
    WHERE o.status = 'delivered'
    ORDER BY o.order_date, o.order_id
""", con)
sales.to_csv(OUT / "sales.csv", index=False, encoding="utf-8")

# Дневная таблица по каналам: реклама хранится по дням, поэтому её нельзя склеивать с позициями заказов
# (сумма рекламы задвоится). Считаем всё на уровне «день × канал».
ads = pd.read_sql_query('SELECT date AS "Дата", channel AS "Канал", spend AS "Реклама" FROM marketing_spend', con)
daily = (sales.groupby(["Дата", "Канал"], as_index=False)
              .agg(**{"Заказы": ("Заказ", "nunique"), "Выручка": ("Выручка", "sum"), "Себестоимость": ("Себестоимость", "sum"),
                      "Комиссия": ("Комиссия", "sum"), "Логистика": ("Логистика", "sum")})
              .merge(ads, on=["Дата", "Канал"], how="outer").fillna(0)
              .sort_values(["Дата", "Канал"]))
daily["Заказы"] = daily["Заказы"].astype(int)
daily["Маржинальная прибыль"] = (daily["Выручка"] - daily["Себестоимость"] - daily["Комиссия"]
                                 - daily["Логистика"] - daily["Реклама"]).round(2)
daily.round(2).to_csv(OUT / "daily.csv", index=False, encoding="utf-8")
print(f"sales.csv: {len(sales):,} строк; daily.csv: {len(daily):,} строк".replace(",", " "))
