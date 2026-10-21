-- Схема демонстрационной базы «Дом и уют» (SQLite)

CREATE TABLE channels (
    channel             TEXT PRIMARY KEY,      -- Wildberries, Ozon, Сайт
    commission_rate     REAL NOT NULL,         -- доля комиссии площадки от цены
    logistics_per_item  REAL NOT NULL          -- логистика до покупателя, ₽ за единицу
);

CREATE TABLE products (
    product_id  INTEGER PRIMARY KEY,
    sku         TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL,
    base_price  REAL NOT NULL,                 -- цена на витрине без скидок, ₽
    cost_price  REAL NOT NULL,                 -- себестоимость единицы, ₽
    weight_kg   REAL NOT NULL
);

CREATE TABLE customers (
    customer_id    INTEGER PRIMARY KEY,
    city           TEXT,
    first_channel  TEXT REFERENCES channels(channel),
    registered_at  TEXT NOT NULL               -- дата первого заказа, YYYY-MM-DD
);

CREATE TABLE orders (
    order_id     INTEGER PRIMARY KEY,
    customer_id  INTEGER NOT NULL REFERENCES customers(customer_id),
    order_date   TEXT NOT NULL,                -- YYYY-MM-DD
    channel      TEXT NOT NULL REFERENCES channels(channel),
    status       TEXT NOT NULL,                -- delivered / cancelled
    promo_code   TEXT
);

CREATE TABLE order_items (
    order_id     INTEGER NOT NULL REFERENCES orders(order_id),
    product_id   INTEGER NOT NULL REFERENCES products(product_id),
    quantity     INTEGER NOT NULL,
    price        REAL NOT NULL,                -- фактическая цена продажи за единицу, ₽
    is_returned  INTEGER NOT NULL              -- 1 — покупатель вернул товар (невыкуп или возврат)
);

CREATE TABLE marketing_spend (
    date     TEXT NOT NULL,
    channel  TEXT NOT NULL REFERENCES channels(channel),
    spend    REAL NOT NULL                     -- расходы на рекламу за день, ₽
);

CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_items_order ON order_items(order_id);
