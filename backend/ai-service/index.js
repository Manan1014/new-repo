import express from "express";
import cors from "cors";
import morgan from "morgan";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => res.send("AI service running ✅"));

// Basic forecast & insight generator (mocked AI)
app.post("/forecast", (req, res) => {
  const { data } = req.body;
  console.log("Received data:", data);

  if (!data || !data.data || data.data.length === 0)
    return res.status(400).json({ error: "Missing data" });

  const rows = data.data;
  const salesByMonth = {};

  rows.forEach((r) => {
    const d = new Date(r.date);
    const month = d.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    const total = parseFloat(r.price || 0) * parseInt(r.quantity || 0);
    salesByMonth[month] = (salesByMonth[month] || 0) + total;
  });

  const forecast = Object.entries(salesByMonth).map(([month, sales]) => ({
    month,
    sales,
  }));

  const avg = forecast.reduce((a, b) => a + b.sales, 0) / forecast.length;
  const next = { month: "Next", sales: Math.round(avg * 1.05) };

  forecast.push(next);

  const insight =
    avg > 10000
      ? "Sales are performing strongly — focus on maintaining momentum!"
      : "Sales are moderate — consider promotions or new product lines.";

  res.json({ forecast, insight });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🧠 AI-service on ${PORT}`));
