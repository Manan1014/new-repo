import express from "express";
import axios from "axios";
import cors from "cors";
import morgan from "morgan";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan("dev"));

const DATA_SERVICE_URL = "http://localhost:5001";
const AI_SERVICE_URL = "http://localhost:5002";
const AUTH_SERVICE_URL = "http://localhost:5003";
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

app.get("/", (req, res) => {
  res.send("Gateway is running");
});

// Authentication routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/register`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(
      err.response?.data || { error: "Registration failed" }
    );
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/login`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(
      err.response?.data || { error: "Login failed" }
    );
  }
});

app.post("/api/auth/verify", async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/verify`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(
      err.response?.data || { error: "Token verification failed" }
    );
  }
});
// Protected routes - require authentication
app.get("/api/test-db", authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${DATA_SERVICE_URL}/test-db`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Cannot connect to data-service" });
  }
});

app.get("/api/forecast", authenticateToken, async (req, res) => {
  try {
    const data = await axios.get(`${DATA_SERVICE_URL}/data`);
    const ai = await axios.post(`${AI_SERVICE_URL}/forecast`, data.data);
    res.json(ai.data);
  } catch (err) {
    res.status(500).json({ error: "Forecast failed", details: err.message });
  }
});

app.post("/api/forecast", authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        error: "Invalid data format. Expected non-empty array of sales data."
      });
    }

    const invalidRows = data.filter(row =>
      !row.date ||
      typeof row.price !== 'number' ||
      typeof row.quantity !== 'number' ||
      isNaN(row.price) ||
      isNaN(row.quantity)
    );

    if (invalidRows.length > 0) {
      return res.status(400).json({
        error: "Invalid data rows found. Each row must have date, price (number), and quantity (number).",
        invalidRows: invalidRows.slice(0, 3)
      });
    }

    // Generate forecast
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/forecast`, { data });

    // Save monthly data to database
    try {
      await axios.post(`${DATA_SERVICE_URL}/monthly-data`, {
        userId: req.user.userId,
        salesData: data
      });
    } catch (saveError) {
      console.error("Failed to save monthly data:", saveError.message);
      // Don't fail the forecast if saving fails
    }

    res.json(aiResponse.data);
  } catch (err) {
    console.error("Forecast error:", err.message);
    res.status(500).json({ error: "Forecast failed", details: err.message });
  }
});

app.get("/api/data", authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${DATA_SERVICE_URL}/data`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Cannot fetch data", details: err.message });
  }
});

// Protected user profile endpoint
app.get("/api/profile", authenticateToken, (req, res) => {
  res.json({
    message: "Profile accessed successfully",
    user: req.user
  });
});

app.get("/api/test-ai", authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`);
    res.json({
      message: "AI service is reachable",
      aiService: response.data
    });
  } catch (err) {
    res.status(500).json({
      error: "Cannot connect to AI service",
      details: err.message,
      aiServiceUrl: AI_SERVICE_URL
    });
  }
});

// Get user's monthly data
app.get("/api/monthly-data", authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.query;
    const response = await axios.get(`${DATA_SERVICE_URL}/monthly-data/${req.user.userId}`, {
      params: { year, month }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to get monthly data", details: err.message });
  }
});

// Get specific month's transactions
app.get("/api/monthly-data/:year/:month/transactions", authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    const response = await axios.get(`${DATA_SERVICE_URL}/monthly-data/${req.user.userId}/${year}/${month}/transactions`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to get transactions", details: err.message });
  }
});

// Save monthly data directly (without forecast)
app.post("/api/monthly-data", authenticateToken, async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        error: "Invalid data format. Expected non-empty array of sales data."
      });
    }

    const response = await axios.post(`${DATA_SERVICE_URL}/monthly-data`, {
      userId: req.user.userId,
      salesData: data
    });

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to save monthly data", details: err.message });
  }
});

// Delete monthly data
app.delete("/api/monthly-data/:year/:month", authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    const response = await axios.delete(`${DATA_SERVICE_URL}/monthly-data/${req.user.userId}/${year}/${month}`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete monthly data", details: err.message });
  }
});

// User Settings Endpoints

// Get user profile
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${DATA_SERVICE_URL}/user/${req.user.userId}/profile`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to get user profile", details: err.message });
  }
});

// Update user profile
app.put("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const response = await axios.put(`${DATA_SERVICE_URL}/user/${req.user.userId}/profile`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(
      err.response?.data || { error: "Failed to update user profile" }
    );
  }
});

// Change password
app.put("/api/user/password", authenticateToken, async (req, res) => {
  try {
    const response = await axios.put(`${DATA_SERVICE_URL}/user/${req.user.userId}/password`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(
      err.response?.data || { error: "Failed to change password" }
    );
  }
});

// Get user preferences
app.get("/api/user/preferences", authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${DATA_SERVICE_URL}/user/${req.user.userId}/preferences`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to get user preferences", details: err.message });
  }
});

// Update user preferences
app.put("/api/user/preferences", authenticateToken, async (req, res) => {
  try {
    const response = await axios.put(`${DATA_SERVICE_URL}/user/${req.user.userId}/preferences`, req.body);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user preferences", details: err.message });
  }
});

// Delete user account
app.delete("/api/user/account", authenticateToken, async (req, res) => {
  try {
    const response = await axios.delete(`${DATA_SERVICE_URL}/user/${req.user.userId}/account`, {
      data: req.body
    });
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(
      err.response?.data || { error: "Failed to delete account" }
    );
  }
});

// Analytics Endpoints

// Get analytics summary
app.get("/api/analytics/summary", authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${DATA_SERVICE_URL}/analytics/summary/${req.user.userId}`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to get analytics summary", details: err.message });
  }
});

// Get analytics trends
app.get("/api/analytics/trends", authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${DATA_SERVICE_URL}/analytics/trends/${req.user.userId}`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to get analytics trends", details: err.message });
  }
});

// Get analytics categories
app.get("/api/analytics/categories", authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${DATA_SERVICE_URL}/analytics/categories/${req.user.userId}`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to get analytics categories", details: err.message });
  }
});

// Get analytics insights
app.get("/api/analytics/insights", authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${DATA_SERVICE_URL}/analytics/insights/${req.user.userId}`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to get analytics insights", details: err.message });
  }
});

// Download analytics report (PDF)
app.get("/api/analytics/report", authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${DATA_SERVICE_URL}/analytics/report/${req.user.userId}`, {
      responseType: 'arraybuffer'
    });

    // Forward PDF headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', response.headers['content-disposition'] || `attachment; filename=analytics-report.pdf`);
    res.send(response.data);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate report", details: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Gateway running on port ${PORT}`));
