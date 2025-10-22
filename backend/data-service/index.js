// backend/data-service/index.js
import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

console.log("Loaded ENV:", {
  host: process.env.CONTENT_DB_HOST,
  user: process.env.CONTENT_DB_USER,
  password: process.env.CONTENT_DB_PASS ? "****" : "EMPTY",
  db: process.env.CONTENT_DB_NAME,
});

const app = express();
app.use(express.json());

// ✅ Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.CONTENT_DB_HOST || "localhost",
  user: process.env.CONTENT_DB_USER || "root",
  password: process.env.CONTENT_DB_PASS || "YourStrongPassword123!",
  database: process.env.CONTENT_DB_NAME || "ssas_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ Health check for DB
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    res.json({
      message: "✅ Database connected successfully!",
      time: rows[0].now,
    });
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    res.status(500).json({
      error: "Database connection failed",
      details: err.message,
    });
  }
});

// ✅ Main endpoint: Return data from MySQL
app.get("/data", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, month, revenue FROM sales_data LIMIT 100"
    );
    console.log("✅ Fetched data:", rows);
    res.json(rows);
  } catch (err) {
    console.error("❌ Failed to fetch data:", err);
    res.status(500).json({
      error: "Failed to fetch data from database",
      details: err.message,
    });
  }
});

// ✅ Fallback: static sample data (useful for testing if DB empty)
app.get("/data/sample", (req, res) => {
  const sampleData = [
    { id: 1, month: "Jan", revenue: 100 },
    { id: 2, month: "Feb", revenue: 120 },
    { id: 3, month: "Mar", revenue: 150 },
  ];
  res.json(sampleData);
});

const PORT = process.env.DATA_SERVICE_PORT || 5000;
app.listen(PORT, () => console.log(`🧩 Data Service running on port ${PORT}`));
