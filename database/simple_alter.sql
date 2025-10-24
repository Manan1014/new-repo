-- SIMPLE ALTER QUERIES (Run these one by one)
-- These are safer and easier to run individually

-- 1. Create the monthly_sales_data table
CREATE TABLE monthly_sales_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_transactions INT NOT NULL DEFAULT 0,
  avg_transaction_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  top_category VARCHAR(100),
  data_source ENUM('upload', 'manual', 'api') DEFAULT 'upload',
  raw_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_month (user_id, year, month),
  INDEX idx_user_id (user_id),
  INDEX idx_year_month (year, month),
  INDEX idx_updated_at (updated_at)
);

-- 2. Create the sales_transactions table
CREATE TABLE sales_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  monthly_data_id INT NOT NULL,
  user_id INT NOT NULL,
  product_name VARCHAR(255) DEFAULT 'Unknown Product',
  sale_date DATE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (price * quantity) STORED,
  region VARCHAR(100) DEFAULT 'Unknown',
  category VARCHAR(100) DEFAULT 'General',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (monthly_data_id) REFERENCES monthly_sales_data(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_monthly_data_id (monthly_data_id),
  INDEX idx_user_id (user_id),
  INDEX idx_sale_date (sale_date),
  INDEX idx_category (category)
);

-- 3. Optional: Update existing sales_data table (only if needed)
-- Run these only if the columns don't exist in your sales_data table

-- Add product_name column (if it doesn't exist)
-- ALTER TABLE sales_data ADD COLUMN product_name VARCHAR(255) DEFAULT 'Unknown Product' AFTER user_id;

-- Add sale_date column (if it doesn't exist)  
-- ALTER TABLE sales_data ADD COLUMN sale_date DATE AFTER product_name;

-- Add price column (if it doesn't exist)
-- ALTER TABLE sales_data ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER sale_date;

-- Add quantity column (if it doesn't exist)
-- ALTER TABLE sales_data ADD COLUMN quantity INT NOT NULL DEFAULT 1 AFTER price;

-- Add total_amount column (if it doesn't exist)
-- ALTER TABLE sales_data ADD COLUMN total_amount DECIMAL(10,2) GENERATED ALWAYS AS (price * quantity) STORED AFTER quantity;

-- Add region column (if it doesn't exist)
-- ALTER TABLE sales_data ADD COLUMN region VARCHAR(100) DEFAULT 'Unknown' AFTER total_amount;

-- Add category column (if it doesn't exist)
-- ALTER TABLE sales_data ADD COLUMN category VARCHAR(100) DEFAULT 'General' AFTER region;

-- Add indexes (safe to run multiple times)
-- CREATE INDEX idx_sale_date ON sales_data(sale_date);
-- CREATE INDEX idx_category ON sales_data(category);
-- CREATE INDEX idx_region ON sales_data(region);