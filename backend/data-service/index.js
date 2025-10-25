import express from "express";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { saveMonthlyData, getUserMonthlyData, getMonthTransactions, deleteMonthlyData } from "./monthly-data.js";
import {
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  getUserPreferences,
  updateUserPreferences,
  deleteUserAccount
} from "./user-settings.js";
import {
  getAnalyticsSummary,
  getAnalyticsTrends,
  getAnalyticsCategories,
  getAnalyticsInsights
} from "./analytics.js";
import { generateAnalyticsReport } from "./report-generator.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));
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

// Save monthly data (called after forecast generation)
app.post("/monthly-data", async (req, res) => {
  try {
    const { userId, salesData } = req.body;

    if (!userId || !salesData || !Array.isArray(salesData)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    const results = await saveMonthlyData(userId, salesData);
    res.json({
      message: "Monthly data saved successfully",
      data: results
    });
  } catch (error) {
    console.error("Save monthly data error:", error);
    res.status(500).json({ error: "Failed to save monthly data", details: error.message });
  }
});

// Get user's monthly data
app.get("/monthly-data/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { year, month } = req.query;

    const data = await getUserMonthlyData(parseInt(userId), year ? parseInt(year) : null, month ? parseInt(month) : null);
    res.json(data);
  } catch (error) {
    console.error("Get monthly data error:", error);
    res.status(500).json({ error: "Failed to get monthly data", details: error.message });
  }
});

// Get specific month's transactions
app.get("/monthly-data/:userId/:year/:month/transactions", async (req, res) => {
  try {
    const { userId, year, month } = req.params;

    const transactions = await getMonthTransactions(parseInt(userId), parseInt(year), parseInt(month));
    res.json(transactions);
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Failed to get transactions", details: error.message });
  }
});

// Delete monthly data
app.delete("/monthly-data/:userId/:year/:month", async (req, res) => {
  try {
    const { userId, year, month } = req.params;

    const result = await deleteMonthlyData(parseInt(userId), parseInt(year), parseInt(month));
    res.json(result);
  } catch (error) {
    console.error("Delete monthly data error:", error);
    res.status(500).json({ error: "Failed to delete monthly data", details: error.message });
  }
});

// User Settings Endpoints

// Get user profile
app.get("/user/:userId/profile", async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await getUserProfile(parseInt(userId));
    res.json(profile);
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ error: "Failed to get user profile", details: error.message });
  }
});

// Update user profile
app.put("/user/:userId/profile", async (req, res) => {
  try {
    const { userId } = req.params;
    const updatedProfile = await updateUserProfile(parseInt(userId), req.body);
    res.json(updatedProfile);
  } catch (error) {
    console.error("Update user profile error:", error);
    if (error.message === 'Email is already taken by another user') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to update user profile", details: error.message });
    }
  }
});

// Change password
app.put("/user/:userId/password", async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const result = await changeUserPassword(parseInt(userId), currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    console.error("Change password error:", error);
    if (error.message === 'Current password is incorrect') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to change password", details: error.message });
    }
  }
});

// Get user preferences
app.get("/user/:userId/preferences", async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = await getUserPreferences(parseInt(userId));
    res.json(preferences);
  } catch (error) {
    console.error("Get user preferences error:", error);
    res.status(500).json({ error: "Failed to get user preferences", details: error.message });
  }
});

// Update user preferences
app.put("/user/:userId/preferences", async (req, res) => {
  try {
    const { userId } = req.params;
    const updatedPreferences = await updateUserPreferences(parseInt(userId), req.body);
    res.json(updatedPreferences);
  } catch (error) {
    console.error("Update user preferences error:", error);
    res.status(500).json({ error: "Failed to update user preferences", details: error.message });
  }
});

// Delete user account
app.delete("/user/:userId/account", async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required to delete account" });
    }

    const result = await deleteUserAccount(parseInt(userId), password);
    res.json(result);
  } catch (error) {
    console.error("Delete user account error:", error);
    if (error.message === 'Password is incorrect') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to delete account", details: error.message });
    }
  }
});

// Analytics Endpoints - Using Real Data from Database

// Get analytics summary
app.get("/analytics/summary/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const summary = await getAnalyticsSummary(parseInt(userId));
    res.json(summary);
  } catch (error) {
    console.error("Get analytics summary error:", error);
    res.status(500).json({ error: "Failed to get analytics summary", details: error.message });
  }
});

// Get analytics trends
app.get("/analytics/trends/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const trends = await getAnalyticsTrends(parseInt(userId));
    res.json(trends);
  } catch (error) {
    console.error("Get analytics trends error:", error);
    res.status(500).json({ error: "Failed to get analytics trends", details: error.message });
  }
});

// Get analytics categories
app.get("/analytics/categories/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const categories = await getAnalyticsCategories(parseInt(userId));
    res.json(categories);
  } catch (error) {
    console.error("Get analytics categories error:", error);
    res.status(500).json({ error: "Failed to get analytics categories", details: error.message });
  }
});

// Get analytics insights
app.get("/analytics/insights/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const insights = await getAnalyticsInsights(parseInt(userId));
    res.json(insights);
  } catch (error) {
    console.error("Get analytics insights error:", error);
    res.status(500).json({ error: "Failed to get analytics insights", details: error.message });
  }
});

// Generate PDF report
app.get("/analytics/report/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Generate PDF report
    const pdfBuffer = await generateAnalyticsReport(parseInt(userId));

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Generate report error:", error);
    res.status(500).json({ error: "Failed to generate report", details: error.message });
  }
});

const PORT = process.env.DATA_SERVICE_PORT || 5001;
app.listen(PORT, () => console.log(`Data Service running on port ${PORT}`));
