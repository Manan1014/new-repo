import express from "express";
import axios from "axios";
import cors from "cors";
import morgan from "morgan";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const DATA_SERVICE_URL = "http://localhost:5001";
const AI_SERVICE_URL = "http://localhost:5002";

app.get("/", (req, res) => {
  res.send("Gateway is running");
});
app.get("/api/test-db", async (req, res) => {
  try {
    const response = await axios.get(`${DATA_SERVICE_URL}/test-db`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Cannot connect to data-service" });
  }
});

app.get("/api/forecast", async (req, res) => {
  try {
    const data = await axios.get(`${DATA_SERVICE_URL}/data`);
    const ai = await axios.post(`${AI_SERVICE_URL}/forecast`, data.data);
    res.json(ai.data);
  } catch (err) {
    res.status(500).json({ error: "Forecast failed", details: err.message });
  }
});

app.post("/api/forecast", async (req, res) => {
  try {
    const { data } = req.body;
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/forecast`, { data });
    res.json(aiResponse.data);
  } catch (err) {
    console.error("Forecast error:", err.message);
    res.status(500).json({ error: "Forecast failed", details: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Gateway running on port ${PORT}`));
