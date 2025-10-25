import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import OpenAI from "openai";
import { PolynomialRegression } from "ml-regression";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.get("/", (req, res) => res.send("AI + ML service running"));
app.post("/forecast", async (req, res) => {
  const data = req.body;

  if (!data || !data.data || data.data.length === 0) {
    return res.status(400).json({ error: "Missing data" });
  }

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
  let regressionForecast = null;
  try {
    const x = forecast.map((_, i) => i + 1);
    const y = forecast.map((f) => f.sales);

    if (x.length >= 3) {
      const degree = Math.min(2, x.length - 1);
      const regression = new PolynomialRegression(x, y, degree);
      const nextMonth = x.length + 1;
      regressionForecast = regression.predict(nextMonth);

      forecast.push({
        month: "Next (ML Forecast)",
        sales: Math.round(regressionForecast),
      });
    } else {
      regressionForecast = y[y.length - 1];
      forecast.push({
        month: "Next (ML Forecast)",
        sales: Math.round(regressionForecast),
      });
    }
  } catch (err) {
    console.error("ML Forecast error:", err.message);
  }
  const avg =
    forecast.length > 0
      ? forecast.reduce((sum, item) => sum + item.sales, 0) / forecast.length
      : 0;

  const insight =
    avg > 10000
      ? "Sales are performing strongly — focus on scaling operations."
      : "Sales are moderate — consider targeted marketing or discount strategies.";

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
      console.error("AI generation error:", err.message);
    }
  }
  res.json({
    forecast,
    mlForecast: regressionForecast,
    insight,
    aiInsight,
  });
});

// POST /api/insights - Generate insights from sales data summary
app.post("/api/insights", async (req, res) => {
  try {
    const { summary, trends, categories } = req.body;

    if (!summary) {
      return res.status(400).json({ error: "Missing summary data" });
    }

    const insights = [];

    // Rule 1: Growth Analysis
    const growth = summary.growth || 0;
    if (growth > 10) {
      insights.push({
        icon: "📈",
        title: "Strong Growth Trend",
        text: `Sales are showing strong upward momentum with ${growth.toFixed(
          1
        )}% growth. This indicates successful strategies and market acceptance. Continue current initiatives while exploring expansion opportunities.`,
        color: "text-green-600 dark:text-green-400",
        priority: "high",
      });
    } else if (growth > 0 && growth <= 10) {
      insights.push({
        icon: "📊",
        title: "Steady Growth",
        text: `Sales are growing at a moderate pace of ${growth.toFixed(
          1
        )}%. Consider implementing targeted marketing campaigns or promotional strategies to accelerate growth.`,
        color: "text-blue-600 dark:text-blue-400",
        priority: "medium",
      });
    } else if (growth < 0) {
      insights.push({
        icon: "📉",
        title: "Declining Sales",
        text: `Sales are declining by ${Math.abs(growth).toFixed(
          1
        )}%. Immediate action required: review pricing strategy, analyze competitor activities, and consider customer feedback to identify pain points.`,
        color: "text-red-600 dark:text-red-400",
        priority: "critical",
      });
    } else {
      insights.push({
        icon: "➡️",
        title: "Stable Performance",
        text: "Sales are stable with no significant growth or decline. Consider testing new strategies to drive growth while maintaining current performance levels.",
        color: "text-gray-600 dark:text-gray-400",
        priority: "low",
      });
    }

    // Rule 2: Average Order Value Analysis
    const avgOrderValue = summary.avgOrderValue || 0;
    if (avgOrderValue > 0) {
      if (avgOrderValue < 100) {
        insights.push({
          icon: "💰",
          title: "Low Order Value",
          text: `Average order value is $${avgOrderValue.toFixed(
            0
          )}. Implement upselling and cross-selling strategies, bundle products, or introduce minimum order incentives to increase transaction value.`,
          color: "text-yellow-600 dark:text-yellow-400",
          priority: "medium",
        });
      } else if (avgOrderValue >= 100 && avgOrderValue < 300) {
        insights.push({
          icon: "💵",
          title: "Moderate Order Value",
          text: `Average order value is $${avgOrderValue.toFixed(
            0
          )}. Good baseline, but there's room for improvement. Consider premium product offerings or loyalty programs to increase customer spend.`,
          color: "text-blue-600 dark:text-blue-400",
          priority: "low",
        });
      } else {
        insights.push({
          icon: "💎",
          title: "High Order Value",
          text: `Excellent average order value of $${avgOrderValue.toFixed(
            0
          )}. Focus on customer retention and satisfaction to maintain this premium positioning. Consider VIP programs for top spenders.`,
          color: "text-purple-600 dark:text-purple-400",
          priority: "low",
        });
      }
    }

    // Rule 3: Best Month Analysis
    if (summary.bestMonth && summary.bestMonthSales) {
      insights.push({
        icon: "🎯",
        title: "Peak Performance Period",
        text: `${summary.bestMonth} was your strongest period with $${(
          summary.bestMonthSales / 1000
        ).toFixed(
          1
        )}K in sales. Analyze what worked during this time - seasonal factors, promotions, or marketing campaigns - and replicate successful strategies.`,
        color: "text-indigo-600 dark:text-indigo-400",
        priority: "medium",
      });
    }

    // Rule 4: Category Analysis (if provided)
    if (categories && categories.length > 0) {
      const topCategory = categories[0];
      const bottomCategory = categories[categories.length - 1];

      if (topCategory.percentage > 40) {
        insights.push({
          icon: "⚠️",
          title: "High Category Concentration",
          text: `${topCategory.name} represents ${topCategory.percentage}% of sales. While this shows strength, consider diversifying to reduce risk. Explore complementary product lines or expand into related categories.`,
          color: "text-orange-600 dark:text-orange-400",
          priority: "medium",
        });
      } else {
        insights.push({
          icon: "🎨",
          title: "Balanced Portfolio",
          text: `${topCategory.name} leads with ${topCategory.percentage}% of sales, showing healthy diversification. Continue investing in top performers while nurturing emerging categories.`,
          color: "text-green-600 dark:text-green-400",
          priority: "low",
        });
      }

      if (bottomCategory.percentage < 5) {
        insights.push({
          icon: "🔍",
          title: "Underperforming Category",
          text: `${bottomCategory.name} accounts for only ${bottomCategory.percentage}% of sales. Evaluate if this category should be discontinued, repositioned, or given more marketing support.`,
          color: "text-gray-600 dark:text-gray-400",
          priority: "low",
        });
      }
    }

    // Rule 5: Trend Analysis (if provided)
    if (trends && trends.length >= 3) {
      const recentTrends = trends.slice(-3);
      const isConsistentGrowth = recentTrends.every(
        (t, i) => i === 0 || t.sales >= recentTrends[i - 1].sales
      );
      const isConsistentDecline = recentTrends.every(
        (t, i) => i === 0 || t.sales <= recentTrends[i - 1].sales
      );

      if (isConsistentGrowth) {
        insights.push({
          icon: "🚀",
          title: "Positive Momentum",
          text: "Last 3 months show consistent growth. Excellent trajectory! Maintain current strategies, increase inventory for high-demand items, and prepare for scaling operations.",
          color: "text-green-600 dark:text-green-400",
          priority: "high",
        });
      } else if (isConsistentDecline) {
        insights.push({
          icon: "🔴",
          title: "Concerning Trend",
          text: "Last 3 months show consistent decline. Urgent attention needed: conduct customer surveys, review competitor pricing, and consider promotional campaigns to reverse the trend.",
          color: "text-red-600 dark:text-red-400",
          priority: "critical",
        });
      } else {
        insights.push({
          icon: "📊",
          title: "Fluctuating Performance",
          text: "Sales show variability in recent months. Identify patterns - seasonal factors, marketing campaign timing, or external events - to better predict and manage fluctuations.",
          color: "text-blue-600 dark:text-blue-400",
          priority: "medium",
        });
      }
    }

    // Rule 6: Total Sales Volume Analysis
    const totalSales = summary.totalSales || 0;
    if (totalSales > 0) {
      if (totalSales < 50000) {
        insights.push({
          icon: "🌱",
          title: "Early Stage Business",
          text: `Total sales of $${(totalSales / 1000).toFixed(
            1
          )}K indicate early growth phase. Focus on customer acquisition, brand awareness, and product-market fit. Consider digital marketing and referral programs.`,
          color: "text-teal-600 dark:text-teal-400",
          priority: "medium",
        });
      } else if (totalSales >= 50000 && totalSales < 500000) {
        insights.push({
          icon: "📈",
          title: "Growing Business",
          text: `Total sales of $${(totalSales / 1000).toFixed(
            1
          )}K show solid growth. Time to optimize operations, improve customer retention, and explore new market segments or channels.`,
          color: "text-blue-600 dark:text-blue-400",
          priority: "low",
        });
      } else {
        insights.push({
          icon: "🏆",
          title: "Established Business",
          text: `Strong total sales of $${(totalSales / 1000).toFixed(
            1
          )}K demonstrate market leadership. Focus on innovation, customer loyalty programs, and strategic partnerships to maintain competitive advantage.`,
          color: "text-purple-600 dark:text-purple-400",
          priority: "low",
        });
      }
    }

    // Sort insights by priority (critical > high > medium > low)
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    insights.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    // Return top 5 most relevant insights
    const topInsights = insights.slice(0, 5);

    res.json({
      insights: topInsights,
      totalInsights: insights.length,
      analysisType: "rule-based",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Insights generation error:", error);
    res.status(500).json({
      error: "Failed to generate insights",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`AI + ML service running on ${PORT}`));
