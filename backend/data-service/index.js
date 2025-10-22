import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
const pool = mysql.createPool({
  host: process.env.CONTENT_DB_HOST || "localhost",
  user: process.env.CONTENT_DB_USER || "root",
  password: process.env.CONTENT_DB_PASS || "YourStrongPassword123!",
  database: process.env.CONTENT_DB_NAME || "ssas_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS now");
    res.json({
      message: "Database connected successfully!",
      time: rows[0].now,
    });
  } catch (err) {
    console.error("Database connection failed:", err);
    res.status(500).json({
      error: "Database connection failed",
      details: err.message,
    });
  }
});
app.get("/data", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, month, revenue FROM sales_data LIMIT 100"
    );
    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch data:", err);
    res.status(500).json({
      error: "Failed to fetch data from database",
      details: err.message,
    });
  }
});
app.get("/data/sample", (req, res) => {
  const sampleData = [
    { id: 1, month: "Jan", revenue: 100 },
    { id: 2, month: "Feb", revenue: 120 },
    { id: 3, month: "Mar", revenue: 150 },
  ];
  res.json(sampleData);
});

const PORT = process.env.DATA_SERVICE_PORT || 5001;
app.listen(PORT, () => console.log(`Data Service running on port ${PORT}`));
