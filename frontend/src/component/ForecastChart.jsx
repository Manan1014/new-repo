import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function ForecastChart({ data = [] }) {
  // Expecting data array like: [{ month: 'Nov', sales: 13000 }, ...]
  if (!data || data.length === 0) {
    return (
      <div className="empty">
        No forecast data yet. Upload CSV to generate forecast.
      </div>
    );
  }

  // Convert numeric sales if strings
  const parsed = data.map((d) => ({ ...d, sales: Number(d.sales) }));

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={parsed}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#1976d2"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
