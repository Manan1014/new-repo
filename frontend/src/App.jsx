import React, { useState } from "react";
import UploadForm from "./components/UploadForm";
import ForecastChart from "./components/ForecastChart";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function App() {
  const [forecast, setForecast] = useState([]);
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async (csvText) => {
    try {
      setLoading(true);
      setMessage("Uploading data...");
      // send CSV to gateway/data-service
      await axios.post(
        `${API_URL}/api/data/upload`,
        { csvData: csvText },
        { timeout: 120000 }
      );
      setMessage("Data uploaded. Requesting AI forecast...");
      // request forecast/insight
      const res = await axios.get(`${API_URL}/api/ai/forecast`);
      setForecast(res.data.forecast || []);
      setInsight(res.data.insight || "");
      setMessage("Done");
    } catch (err) {
      console.error(err);
      setMessage("Error: " + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>AI-Powered Business Insights</h1>
        <p className="sub">
          Upload sales data (CSV) → view KPIs, forecast & AI insight
        </p>
      </header>

      <main>
        <UploadForm
          onUpload={handleUpload}
          loading={loading}
          message={message}
        />

        <section className="cards">
          <div className="card">
            <h3>AI Insight</h3>
            <p>{insight || "Upload data to generate insights."}</p>
          </div>
          <div className="card">
            <h3>Status</h3>
            <p>{loading ? "Processing..." : message || "Idle"}</p>
          </div>
        </section>

        <section className="chart-section">
          <h2>Forecast</h2>
          <ForecastChart data={forecast} />
        </section>
      </main>

      <footer>
        <small>Backend: {API_URL} · Frontend: Vite</small>
      </footer>
    </div>
  );
}
