-- backend/database/competitor_prices_schema.sql
-- Run this SQL to create the competitor_prices table

CREATE TABLE IF NOT EXISTS competitor_prices (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  competitor_name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  url TEXT,
  last_scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, competitor_name)
);

CREATE TABLE IF NOT EXISTS competitor_price_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  competitor_name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  price_change DECIMAL(10, 2),
  change_percentage DECIMAL(5, 2)
);

CREATE INDEX idx_competitor_prices_product ON competitor_prices(product_id);
CREATE INDEX idx_competitor_price_history_product ON competitor_price_history(product_id, recorded_at);

-- Add a column to track last refresh time per product
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_competitor_refresh TIMESTAMP;