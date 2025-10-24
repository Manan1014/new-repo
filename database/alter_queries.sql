-- ALTER QUERIES FOR EXISTING DATABASE
-- Run these queries one by one in your MySQL database

-- 1. Create monthly_sales_data table (new table for monthly summaries)
CREATE TABLE IF NOT EXISTS monthly_sales_data (
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

-- 2. Create sales_transactions table (new table for detailed transactions)
CREATE TABLE IF NOT EXISTS sales_transactions (
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

-- 3. Update existing sales_data table (if you want to keep it compatible)
-- Add new columns to existing sales_data table if they don't exist

-- Check if product_name column exists, if not add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'sales_data' 
AND column_name = 'product_name';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE sales_data ADD COLUMN product_name VARCHAR(255) DEFAULT "Unknown Product" AFTER user_id;', 
  'SELECT "product_name column already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if sale_date column exists, if not add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'sales_data' 
AND column_name = 'sale_date';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE sales_data ADD COLUMN sale_date DATE AFTER product_name;', 
  'SELECT "sale_date column already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if price column exists, if not add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'sales_data' 
AND column_name = 'price';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE sales_data ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER sale_date;', 
  'SELECT "price column already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if quantity column exists, if not add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'sales_data' 
AND column_name = 'quantity';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE sales_data ADD COLUMN quantity INT NOT NULL DEFAULT 1 AFTER price;', 
  'SELECT "quantity column already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if total_amount column exists, if not add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'sales_data' 
AND column_name = 'total_amount';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE sales_data ADD COLUMN total_amount DECIMAL(10,2) GENERATED ALWAYS AS (price * quantity) STORED AFTER quantity;', 
  'SELECT "total_amount column already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if region column exists, if not add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'sales_data' 
AND column_name = 'region';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE sales_data ADD COLUMN region VARCHAR(100) DEFAULT "Unknown" AFTER total_amount;', 
  'SELECT "region column already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if category column exists, if not add it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'sales_data' 
AND column_name = 'category';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE sales_data ADD COLUMN category VARCHAR(100) DEFAULT "General" AFTER region;', 
  'SELECT "category column already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes to sales_data table if they don't exist
CREATE INDEX IF NOT EXISTS idx_sale_date ON sales_data(sale_date);
CREATE INDEX IF NOT EXISTS idx_category ON sales_data(category);
CREATE INDEX IF NOT EXISTS idx_region ON sales_data(region);

-- Show final table structures
SHOW CREATE TABLE monthly_sales_data;
SHOW CREATE TABLE sales_transactions;
SHOW CREATE TABLE sales_data;