import express from "express";
import axios from "axios";
import cors from "cors";
import morgan from "morgan";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// URLs for services
const DATA_SERVICE_URL = "http://localhost:5001";
const AI_SERVICE_URL = "http://localhost:5002";

// Root test
app.get("/", (req, res) => {
  res.send("🚀 Gateway is running");
});

// ✅ Route: Test data-service connection
app.get("/api/test-db", async (req, res) => {
  try {
    const response = await axios.get(`${DATA_SERVICE_URL}/test-db`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Cannot connect to data-service" });
  }
});

// ✅ Route: AI forecast example (GET)
app.get("/api/forecast", async (req, res) => {
  console.log("GET /api/forecast called");
  try {
    const data = await axios.get(`${DATA_SERVICE_URL}/data`);
    const ai = await axios.post(`${AI_SERVICE_URL}/forecast`, data.data);
    res.json(ai.data);
  } catch (err) {
    res.status(500).json({ error: "Forecast failed", details: err.message });
  }
});

app.post("/api/forecast", async (req, res) => {
  console.log("POST /ai/forecast called with data:", req.body);
  try {
    const { data } = req.body;
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/forecast`, { data });
    console.log("ai response", aiResponse);
    res.json(aiResponse.data);
  } catch (err) {
    console.error("Forecast error:", err.message);
    res.status(500).json({ error: "Forecast failed", details: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Gateway running on port ${PORT}`));
