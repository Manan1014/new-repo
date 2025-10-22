// ai-service/index.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import OpenAI from "openai";
import { PolynomialRegression } from "ml-regression"; // ✅ ML library

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// ✅ Initialize OpenAI client (optional)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.get("/", (req, res) => res.send("🧠 AI + ML service running ✅"));

// 📈 Forecast route
app.post("/forecast", async (req, res) => {
  const { data } = req.body;

  if (!data || !data.data || data.data.length === 0) {
    return res.status(400).json({ error: "Missing data" });
  }

  const rows = data.data;
  const salesByMonth = {};

  // 🧩 Step 1: Aggregate sales per month
  rows.forEach((r) => {
    const d = new Date(r.date);
    const month = d.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    const total = parseFloat(r.price || 0) * parseInt(r.quantity || 0);
    salesByMonth[month] = (salesByMonth[month] || 0) + total;
  });

  // Convert to array
  const forecast = Object.entries(salesByMonth).map(([month, sales]) => ({
    month,
    sales,
  }));

  // 🧮 Step 2: Train ML model (Polynomial Regression)
  let regressionForecast = null;
  try {
    const x = forecast.map((_, i) => i + 1);
    const y = forecast.map((f) => f.sales);

    if (x.length >= 3) {
      const degree = Math.min(2, x.length - 1); // quadratic fit if possible
      const regression = new PolynomialRegression(x, y, degree);
      const nextMonth = x.length + 1;
      regressionForecast = regression.predict(nextMonth);

      forecast.push({
        month: "Next (ML Forecast)",
        sales: Math.round(regressionForecast),
      });
    } else {
      regressionForecast = y[y.length - 1]; // fallback to last sales value
      forecast.push({
        month: "Next (ML Forecast)",
        sales: Math.round(regressionForecast),
      });
    }
  } catch (err) {
    console.error("⚠️ ML Forecast error:", err.message);
  }

  // 💡 Step 3: Local numeric insight
  const avg =
    forecast.length > 0
      ? forecast.reduce((a, b) => a + b.sales, 0) / forecast.length
      : 0;

  const insight =
    avg > 10000
      ? "Sales are performing strongly — focus on scaling operations."
      : "Sales are moderate — consider targeted marketing or discount strategies.";

  // 🤖 Step 4: AI-powered text insight (optional)
  let aiInsight = "AI insight unavailable.";
  if (openai) {
    try {
      const prompt = `
        Analyze the following monthly sales and ML forecast:
        ${JSON.stringify(forecast, null, 2)}
        
        Provide a concise business insight (max 3 sentences):
        - Discuss the trend direction
        - Give one actionable recommendation
        - Keep it practical and data-driven
      `;

      const aiRes = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7"),
      });

      aiInsight = aiRes.choices[0].message.content.trim();
    } catch (err) {
      console.error("⚠️ AI generation error:", err.message);
    }
  }

  // 📤 Response
  res.json({
    forecast,
    mlForecast: regressionForecast,
    insight,
    aiInsight,
  });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 AI + ML service running on ${PORT}`));
