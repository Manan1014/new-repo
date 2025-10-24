-- Quick setup for Settings functionality
-- Run this in your MySQL database

USE ssas_db;

-- 1. Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  theme ENUM('light', 'dark', 'auto') DEFAULT 'light',
  currency VARCHAR(3) DEFAULT 'USD',
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(5) DEFAULT 'en',
  notifications_email BOOLEAN DEFAULT TRUE,
  notifications_push BOOLEAN DEFAULT FALSE,
  date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
  number_format VARCHAR(20) DEFAULT 'US',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_preferences (user_id),
  INDEX idx_user_id (user_id)
);

-- 2. Insert default preferences for existing users
INSERT INTO user_preferences (user_id, theme, currency, timezone)
SELECT id, 'light', 'USD', 'UTC' 
FROM users 
WHERE id NOT IN (SELECT user_id FROM user_preferences WHERE user_preferences.user_id IS NOT NULL);

-- Verify setup
SELECT 'Settings tables created successfully!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as preferences_count FROM user_preferences;