import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: question }],
    });
    res.json({ answer: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI service error" });
  }
});

app.post("/forecast", async (req, res) => {
  try {
    const { data } = req.body;
    
    // Create a prompt for sales forecasting
    const prompt = `
    You are a sales forecasting expert. Based on the following sales data, provide a detailed forecast analysis:
    
    Data: ${JSON.stringify(data)}
    
    Please provide:
    1. Sales trend analysis
    2. Forecast for next 3 months
    3. Key insights and recommendations
    4. Risk factors to consider
    
    Format your response as JSON with the following structure:
    {
      "trend": "description of current trend",
      "forecast": {
        "month1": number,
        "month2": number,
        "month3": number
      },
      "insights": ["insight1", "insight2", "insight3"],
      "risks": ["risk1", "risk2"]
    }
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    // Try to parse the JSON response
    let forecastData;
    try {
      forecastData = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      // If JSON parsing fails, return a structured response
      forecastData = {
        trend: "Analysis completed",
        forecast: { month1: 0, month2: 0, month3: 0 },
        insights: ["AI analysis completed"],
        risks: ["Data parsing required"],
        rawResponse: response.choices[0].message.content
      };
    }

    res.json(forecastData);
  } catch (err) {
    console.error("Forecast error:", err);
    res.status(500).json({ error: "AI forecast service error", details: err.message });
  }
});

app.listen(5000, () => console.log("AI service running on port 5000"));
