// ai-service/index.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.get("/", (req, res) => res.send("AI service running ✅"));

app.post("/forecast", async (req, res) => {
  const { data } = req.body;
  console.log("Received data:", data);

  if (!data || !data.data || data.data.length === 0)
    return res.status(400).json({ error: "Missing data" });

  const rows = data.data;
  const salesByMonth = {};

  // 1️⃣ Aggregate data by month
  rows.forEach((r) => {
    const d = new Date(r.date);
    const month = d.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    const total = parseFloat(r.price || 0) * parseInt(r.quantity || 0);
    salesByMonth[month] = (salesByMonth[month] || 0) + total;
  });

  // 2️⃣ Convert to array and compute average
  const forecast = Object.entries(salesByMonth).map(([month, sales]) => ({
    month,
    sales,
  }));

  const avg =
    forecast.length > 0
      ? forecast.reduce((a, b) => a + b.sales, 0) / forecast.length
      : 0;

  // 3️⃣ Linear trend prediction (simple regression)
  const months = forecast.map((_, i) => i + 1);
  const sales = forecast.map((f) => f.sales);
  const n = months.length;
  const sumX = months.reduce((a, b) => a + b, 0);
  const sumY = sales.reduce((a, b) => a + b, 0);
  const sumXY = months.reduce((a, b, i) => a + b * sales[i], 0);
  const sumXX = months.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX ** 2 || 1);
  const intercept = sumY / n - slope * (sumX / n);
  const nextMonth = n + 1;
  const regressionForecast = slope * nextMonth + intercept;

  forecast.push({
    month: "Next (Regression)",
    sales: Math.round(regressionForecast),
  });

  // 4️⃣ Local insight
  const insight =
    avg > 10000
      ? "Sales are performing strongly — focus on maintaining momentum!"
      : "Sales are moderate — consider promotions or new product lines.";

  // 5️⃣ Optional GPT insight
  let aiInsight = "No AI insight generated.";
  if (openai) {
    try {
      const prompt = `
        Analyze this sales trend data: ${JSON.stringify(forecast)}.
        Provide a short, business-friendly insight (2 sentences max) about trends and next steps.
      `;
      const aiRes = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });
      aiInsight = aiRes.choices[0].message.content.trim();
    } catch (err) {
      console.error("AI Insight Error:", err.message);
    }
  }

  res.json({ forecast, insight, aiInsight });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🧠 AI-service on ${PORT}`));
