-- SSAS Database Schema
-- Run this file manually: mysql -u root -p < database/init.sql

CREATE DATABASE IF NOT EXISTS ssas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ssas_db;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Monthly sales summary table (aggregated by user and month)
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

-- Individual sales transactions (detailed records)
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

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE name = name;

-- Insert sample sales data
INSERT INTO sales_data (user_id, product_name, sale_date, price, quantity, region, category) VALUES
(1, 'Laptop Pro', '2024-01-15', 1299.99, 2, 'North America', 'Electronics'),
(1, 'Wireless Mouse', '2024-01-16', 29.99, 5, 'North America', 'Electronics'),
(1, 'Office Chair', '2024-01-17', 199.99, 1, 'Europe', 'Furniture'),
(1, 'Smartphone', '2024-01-18', 799.99, 3, 'Asia', 'Electronics'),
(1, 'Desk Lamp', '2024-01-19', 49.99, 2, 'North America', 'Furniture'),
(1, 'Tablet', '2024-02-15', 399.99, 4, 'Europe', 'Electronics'),
(1, 'Headphones', '2024-02-16', 149.99, 6, 'Asia', 'Electronics'),
(1, 'Monitor', '2024-02-17', 299.99, 3, 'North America', 'Electronics'),
(1, 'Keyboard', '2024-03-15', 79.99, 8, 'Europe', 'Electronics'),
(1, 'Webcam', '2024-03-16', 89.99, 4, 'Asia', 'Electronics')
ON DUPLICATE KEY UPDATE product_name = product_name;
