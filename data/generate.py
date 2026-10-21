"""
Генератор демонстрационного датасета «Дом и уют» — продавец товаров для дома
на Wildberries, Ozon и собственном сайте, октябрь 2024 — сентябрь 2026.

Данные синтетические: реальные данные работодателей не публикуются.
В генератор заложены типичные для маркетплейсов закономерности (сезонность,
неполный выкуп, разная удерживаемость каналов, убыточные SKU), чтобы анализ
находил их так же, как нашёл бы на реальной выгрузке.

Запуск: python data/generate.py  → создаёт data/*.csv и data/marketplace.db
Результат детерминирован (seed=42).
"""
from pathlib import Path
import sqlite3
import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
OUT = Path(__file__).resolve().parent
START, END = pd.Timestamp("2024-10-01"), pd.Timestamp("2026-09-30")
DAYS = pd.date_range(START, END, freq="D")

# ---------- каналы ----------
channels = pd.DataFrame({
    "channel": ["Wildberries", "Ozon", "Сайт"],
    "commission_rate": [0.24, 0.21, 0.035],      # комиссия площадки / эквайринг
    "logistics_per_item": [92.0, 85.0, 160.0],   # логистика до покупателя, ₽ за единицу
})

# ---------- товары ----------
cats = {
    "Текстиль":  (["Плед", "Комплект постельного белья", "Полотенце махровое", "Скатерть", "Подушка декоративная", "Шторы блэкаут", "Покрывало", "Набор кухонных полотенец"], (700, 4800), 0.38),
    "Посуда":    (["Кружка керамическая", "Набор тарелок", "Сковорода", "Френч-пресс", "Салатник", "Чайник заварочный", "Набор бокалов", "Форма для запекания"], (350, 3600), 0.42),
    "Хранение":  (["Органайзер для ящика", "Корзина плетёная", "Контейнеры для круп", "Вакуумные пакеты", "Кофр для одежды", "Полка навесная", "Короб с крышкой"], (250, 2400), 0.36),
    "Декор":     (["Свеча ароматическая", "Ваза стеклянная", "Рамка для фото", "Диффузор", "Зеркало настенное", "Искусственный эвкалипт", "Часы настенные"], (300, 3900), 0.40),
    "Ванная":    (["Коврик для ванной", "Набор дозаторов", "Шторка для душа", "Держатель для щёток", "Халат вафельный", "Корзина для белья"], (300, 3200), 0.39),
}
rows, pid = [], 1
for cat, (names, (lo, hi), cost_share) in cats.items():
    for name in names:
        for variant in rng.choice(["", " (серый)", " (бежевый)", " (белый)", " (графит)", " (оливковый)"], size=rng.integers(2, 5), replace=False):
            price = float(np.round(rng.uniform(lo, hi) / 10) * 10 - 1)
            share = np.clip(rng.normal(cost_share, 0.06), 0.22, 0.62)
            rows.append({"product_id": pid, "sku": f"DU-{pid:04d}", "name": (name + variant).strip(),
                         "category": cat, "base_price": price,
                         "cost_price": float(np.round(price * share, 0)),
                         "weight_kg": float(np.round(rng.uniform(0.2, 3.5), 2))})
            pid += 1
products = pd.DataFrame(rows)
# Несколько «ловушек»: дешёвые объёмные товары, которые после логистики уходят в минус
traps = products[(products.base_price < 600)].sample(6, random_state=7).index
products.loc[traps, "cost_price"] = np.round(products.loc[traps, "base_price"] * 0.55)
products.loc[traps, "weight_kg"] = np.round(rng.uniform(2.5, 4.5, len(traps)), 2)
# Популярность по закону Парето
popularity = rng.pareto(1.6, len(products)) + 0.05
popularity /= popularity.sum()

# ---------- сезонность и рост ----------
def day_weight(d: pd.Timestamp) -> float:
    w = 1.0
    w *= {1: 0.85, 2: 0.92, 3: 1.0, 4: 0.9, 5: 0.85, 6: 0.8, 7: 0.78, 8: 0.86, 9: 0.98, 10: 1.05, 11: 1.35, 12: 1.55}[d.month]
    if d.month == 11 and 8 <= d.day <= 14: w *= 1.6           # распродажа 11.11
    if d.month == 3 and 1 <= d.day <= 7: w *= 1.5              # к 8 Марта
    if d.month == 12 and 10 <= d.day <= 28: w *= 1.25          # новогодние подарки
    if d.weekday() >= 5: w *= 1.08
    months = (d.year - START.year) * 12 + d.month - START.month
    return w * (1 + 0.032 * months)                            # рост ~3% м/м
dw = np.array([day_weight(d) for d in DAYS]); dw /= dw.sum()

# ---------- покупатели ----------
cities = ["Москва", "Санкт-Петербург", "Екатеринбург", "Новосибирск", "Казань", "Нижний Новгород",
          "Краснодар", "Самара", "Воронеж", "Тамбов", "Ростов-на-Дону", "Уфа", "Пермь", "Тюмень"]
city_p = np.array([24, 12, 6, 5, 5, 4, 5, 4, 4, 2, 4, 3, 3, 3], float); city_p /= city_p.sum()
N_CUST = 15500
first_day = rng.choice(len(DAYS), size=N_CUST, p=dw)
first_channel = rng.choice(channels.channel, size=N_CUST, p=[0.52, 0.34, 0.14])
customers = pd.DataFrame({
    "customer_id": np.arange(1, N_CUST + 1),
    "city": rng.choice(cities, size=N_CUST, p=city_p),
    "first_channel": first_channel,
    "registered_at": DAYS[first_day],
})

# ---------- заказы ----------
repeat_mean = {"Wildberries": 0.55, "Ozon": 0.65, "Сайт": 1.35}   # среднее число повторных заказов
gap_mean = {"Wildberries": 75, "Ozon": 70, "Сайт": 55}             # средний интервал, дней
orders, items = [], []
oid = 100001
last_idx = len(DAYS) - 1
for c in customers.itertuples(index=False):
    n = 1 + rng.poisson(repeat_mean[c.first_channel])
    day = int((c.registered_at - START).days)
    ch = c.first_channel
    for k in range(n):
        if day > last_idx:
            break
        d = DAYS[day]
        if k > 0 and rng.random() < 0.25:            # часть повторных покупок уходит в другой канал
            ch = rng.choice(channels.channel, p=[0.45, 0.35, 0.20])
        r = rng.random()
        status = "cancelled" if r < 0.055 else "delivered"
        promo = None
        if ch == "Сайт" and rng.random() < 0.22:
            promo = rng.choice(["WELCOME10", "DOM15", "AUTUMN"], p=[0.5, 0.3, 0.2])
        n_items = 1 + rng.binomial(3, 0.22 if ch != "Сайт" else 0.4)
        chosen = rng.choice(products.index, size=n_items, replace=False, p=popularity)
        disc = {"WELCOME10": 0.10, "DOM15": 0.15, "AUTUMN": 0.12}.get(promo, 0.0)
        season_disc = 0.18 if (d.month == 11 and 8 <= d.day <= 14) else 0.0
        any_returned = False
        for pi in chosen:
            p = products.loc[pi]
            price = p.base_price * (1 - max(disc, season_disc)) * rng.uniform(0.94, 1.04)
            ret_p = {"Текстиль": 0.13, "Посуда": 0.05, "Хранение": 0.04, "Декор": 0.06, "Ванная": 0.07}[p.category]
            if ch == "Wildberries": ret_p += 0.04
            returned = status == "delivered" and rng.random() < ret_p
            any_returned |= returned
            items.append({"order_id": oid, "product_id": int(p.product_id),
                          "quantity": int(1 + rng.binomial(2, 0.12)),
                          "price": float(np.round(price, 0)), "is_returned": int(returned)})
        orders.append({"order_id": oid, "customer_id": c.customer_id, "order_date": d.date().isoformat(),
                       "channel": ch, "status": status, "promo_code": promo})
        oid += 1
        day += max(3, int(rng.exponential(gap_mean[ch])))
orders = pd.DataFrame(orders).sort_values(["order_date", "order_id"]).reset_index(drop=True)
items = pd.DataFrame(items)

# ---------- маркетинг ----------
# Реклама на маркетплейсах: в первые месяцы неэффективна, затем её оптимизируют (ДРР снижается)
rev_day = (items.assign(rev=items.price * items.quantity)
           .merge(orders[["order_id", "order_date", "channel"]], on="order_id")
           .groupby(["order_date", "channel"]).rev.sum())
mk = []
for d in DAYS:
    months = (d.year - START.year) * 12 + d.month - START.month
    for ch, base, floor in [("Wildberries", 0.30, 0.10), ("Ozon", 0.26, 0.09), ("Сайт", 0.16, 0.12)]:
        drr = max(floor, base - 0.012 * months) * rng.uniform(0.85, 1.15)
        rev = rev_day.get((d.date().isoformat(), ch), 0.0)
        mk.append({"date": d.date().isoformat(), "channel": ch, "spend": float(np.round(rev * drr, 0))})
marketing = pd.DataFrame(mk)

# ---------- сохранение чистых данных ----------
for name, df in {"channels": channels, "products": products, "customers": customers.assign(registered_at=customers.registered_at.dt.date.astype(str)),
                 "orders": orders, "order_items": items, "marketing_spend": marketing}.items():
    df.to_csv(OUT / f"{name}.csv", index=False)

db = OUT / "marketplace.db"
db.unlink(missing_ok=True)
con = sqlite3.connect(db)
con.executescript((OUT / "schema.sql").read_text(encoding="utf-8"))
for name in ["channels", "products", "customers", "orders", "order_items", "marketing_spend"]:
    pd.read_csv(OUT / f"{name}.csv").to_sql(name, con, if_exists="append", index=False)
con.commit(); con.close()

# ---------- «сырая» выгрузка для ноутбука по очистке ----------
# Так обычно выглядит склейка отчётов из кабинетов: дубли, разное написание городов,
# числа строкой с запятой, пропуски и пара технических строк.
raw = (items.merge(orders, on="order_id").merge(products[["product_id", "sku", "name", "category"]], on="product_id")
       .merge(customers[["customer_id", "city"]], on="customer_id"))
raw = raw[["order_id", "order_date", "channel", "status", "customer_id", "city", "sku", "name", "category", "quantity", "price", "is_returned", "promo_code"]].copy()
city_variants = {"Москва": ["Москва", "москва", "г. Москва", "Москва "], "Санкт-Петербург": ["Санкт-Петербург", "СПб", "Санкт Петербург", "спб"]}
raw["city"] = [rng.choice(city_variants[c]) if c in city_variants and rng.random() < 0.3 else c for c in raw.city]
raw.loc[rng.random(len(raw)) < 0.03, "city"] = None
raw["channel"] = raw.channel.replace({"Wildberries": "WB"}).where(rng.random(len(raw)) < 0.5, raw.channel)
raw["price"] = raw.price.map(lambda v: f"{v:,.0f}".replace(",", " ") + ",00" if rng.random() < 0.4 else f"{v:.0f}")
# дату в части строк — в формате кабинета ДД.ММ.ГГГГ
mask = rng.random(len(raw)) < 0.35
raw.loc[mask, "order_date"] = pd.to_datetime(raw.loc[mask, "order_date"]).dt.strftime("%d.%m.%Y")
dups = raw.sample(frac=0.015, random_state=3)
raw = pd.concat([raw, dups]).sample(frac=1, random_state=5).reset_index(drop=True)
bad = pd.DataFrame([{c: None for c in raw.columns} | {"order_id": "ИТОГО", "price": "48 512 333,00"},
                    {c: None for c in raw.columns} | {"order_id": 0, "quantity": -1, "price": "0", "sku": "TEST", "name": "тестовый заказ"}])
raw = pd.concat([raw, bad], ignore_index=True)
raw.to_csv(OUT / "raw_export.csv", index=False, sep=";", encoding="utf-8-sig")

# ---------- A/B-тест карточки товара на сайте ----------
# Гипотеза: новая карточка (видео + блок «как выглядит в интерьере») повышает конверсию в заказ.
# Истинный эффект заложен небольшим: +0,6 п.п. к конверсии, средний чек не меняется.
N = 32000
grp = rng.choice(["A", "B"], size=N)
device = rng.choice(["mobile", "desktop"], size=N, p=[0.68, 0.32])
source = rng.choice(["поиск", "реклама", "прямой", "соцсети"], size=N, p=[0.42, 0.28, 0.18, 0.12])
base = np.where(device == "mobile", 0.029, 0.040)
p_conv = base + np.where(grp == "B", 0.006, 0.0)
converted = rng.random(N) < p_conv
revenue = np.where(converted, np.round(rng.lognormal(np.log(2300), 0.6, N), 0), 0)
start_ab = pd.Timestamp("2026-08-04")
ab = pd.DataFrame({
    "user_id": rng.permutation(np.arange(500000, 500000 + N)),
    "group": grp, "first_visit": (start_ab + pd.to_timedelta(rng.integers(0, 28, N), unit="D")).date.astype(str),
    "device": device, "source": source,
    "converted": converted.astype(int), "revenue": revenue,
    "returned": (converted & (rng.random(N) < 0.07)).astype(int),
})
ab.to_csv(OUT / "ab_test.csv", index=False)

print(f"товаров {len(products)}, покупателей {len(customers)}, заказов {len(orders)}, позиций {len(items)}, A/B {len(ab)}")
