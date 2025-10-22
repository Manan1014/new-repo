import React, { useState } from "react";
import * as XLSX from "xlsx";
import { uploadSalesData } from "../api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DataUpload() {
  const [mode, setMode] = useState("manual");
  const [rows, setRows] = useState([{ date: "", price: "", quantity: "" }]);
  const [uploadedRows, setUploadedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const sanitizeRow = (r) => {
    const getField = (pattern, fallback) =>
      Object.keys(r).find((key) => key.toLowerCase().includes(pattern)) ||
      fallback;

    const dateField = getField("date", "date");
    const priceField = getField("price", "price");
    const quantityField = getField("qty", "quantity");

    let dateValue = r[dateField];

    if (typeof dateValue === "number" && dateValue > 1000) {
      const parsed = XLSX.SSF.parse_date_code(dateValue);
      if (parsed) {
        const { y, m, d } = parsed;
        dateValue = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    } else if (dateValue instanceof Date) {
      dateValue = dateValue.toISOString().split("T")[0];
    } else if (typeof dateValue === "string") {
      const clean = dateValue.trim().replace(/[./]/g, "-");
      const parsed = new Date(clean);
      if (!isNaN(parsed)) {
        dateValue = parsed.toISOString().split("T")[0];
      }
    }

    return {
      date: dateValue || "",
      price: Number(r[priceField] ?? 0),
      quantity: Number(r[quantityField] ?? 0),
      product: r.product ?? r.Product ?? "",
    };
  };

  const handleAddRow = () =>
    setRows([...rows, { date: "", price: "", quantity: "" }]);

  const handleRemoveRow = (idx) => setRows(rows.filter((_, i) => i !== idx));

  const handleManualChange = (idx, field, value) => {
    const copy = [...rows];
    copy[idx][field] = value;
    setRows(copy);
  };
  const handleFileChange = async (e) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let json;
      if (file.name.toLowerCase().endsWith(".csv")) {
        const text = await file.text();
        const wb = XLSX.read(text, { type: "string" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      }

      if (!json || json.length === 0) {
        setError("Excel file appears to be empty or has no data rows.");
        return;
      }

      const firstRow = json[0];
      const hasDate = Object.keys(firstRow).some((k) =>
        k.toLowerCase().includes("date")
      );
      const hasPrice = Object.keys(firstRow).some((k) =>
        k.toLowerCase().includes("price")
      );
      const hasQty = Object.keys(firstRow).some(
        (k) =>
          k.toLowerCase().includes("quantity") ||
          k.toLowerCase().includes("qty")
      );

      if (!hasDate || !hasPrice || !hasQty) {
        setError(
          `Missing required columns. Found: ${Object.keys(firstRow).join(
            ", "
          )}. Need 'date', 'price', 'quantity'.`
        );
        return;
      }

      const converted = json.map(sanitizeRow);

      const validRows = converted.filter(
        (r) => r.date && !isNaN(r.price) && !isNaN(r.quantity)
      );

      if (validRows.length === 0) {
        setError(
          "No valid rows found. Ensure date, price, and quantity exist."
        );
        return;
      }

      if (validRows.length < converted.length) {
        setError(
          `Only ${validRows.length} of ${converted.length} rows are valid.`
        );
      }

      setUploadedRows(validRows);
      setResult(null);
    } catch (err) {
      console.error("Excel parsing error:", err);
      setError(
        `Failed to parse Excel file: ${err.message}. Ensure it's a valid file with columns date, price, quantity.`
      );
    }
  };

  const getPayloadFromManual = () =>
    rows.map((r) => ({
      date: r.date,
      price: Number(r.price || 0),
      quantity: Number(r.quantity || 0),
      product: r.product || "",
    }));

  const getCurrentData = () =>
    mode === "manual" ? getPayloadFromManual() : uploadedRows;
  const handleSubmit = async () => {
    setError("");
    setResult(null);
    const data = getCurrentData();

    if (!data.length) {
      setError("No data to submit. Add rows or upload a file first.");
      return;
    }
    if (data.some((r) => !r.date || isNaN(r.price) || isNaN(r.quantity))) {
      setError("Each row must have a valid date, price, and quantity.");
      return;
    }

    setLoading(true);
    try {
      const result = await uploadSalesData({ data });
      setResult(result);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const chartDataFromResult = () => {
    if (!result || !Array.isArray(result.forecast)) return [];
    return result.forecast.map((f) => ({
      month: f.month,
      sales: Number(f.sales),
    }));
  };
  const useSampleManual = () => {
    setRows([
      { date: "2025-01-10", price: 100, quantity: 5 },
      { date: "2025-02-12", price: 120, quantity: 3 },
      { date: "2025-03-15", price: 90, quantity: 4 },
    ]);
    setMode("manual");
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Sales Analyzer</h1>
          <a
            href="/sample_sales_data.csv"
            download
            className="text-sm text-blue-600 hover:underline"
          >
            Download sample CSV file
          </a>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMode("manual")}
            className={`px-3 py-1 rounded ${
              mode === "manual" ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setMode("upload")}
            className={`px-3 py-1 rounded ${
              mode === "upload" ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            Upload Excel
          </button>
          <button
            onClick={useSampleManual}
            className="ml-auto text-sm px-2 py-1 bg-green-100 rounded"
          >
            Use sample manual data
          </button>
        </div>

        {mode === "manual" ? (
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-center">
                <input
                  type="date"
                  value={r.date}
                  onChange={(e) =>
                    handleManualChange(i, "date", e.target.value)
                  }
                  className="border p-2 rounded col-span-1"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={r.price}
                  onChange={(e) =>
                    handleManualChange(i, "price", e.target.value)
                  }
                  className="border p-2 rounded col-span-1"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={r.quantity}
                  onChange={(e) =>
                    handleManualChange(i, "quantity", e.target.value)
                  }
                  className="border p-2 rounded col-span-1"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRemoveRow(i)}
                    className="px-2 py-1 bg-red-100 rounded"
                  >
                    Remove
                  </button>
                  {i === rows.length - 1 && (
                    <button
                      onClick={handleAddRow}
                      className="px-2 py-1 bg-gray-100 rounded"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="border p-2 rounded w-full"
            />
            <div className="text-sm text-gray-600 mt-1">
              <p>
                Accepts Excel (.xlsx, .xls) or CSV files with columns: date,
                price, quantity
              </p>
              <p className="mt-1">
                <strong>Date format:</strong> YYYY-MM-DD (e.g., 2025-01-10)
              </p>
            </div>
            {uploadedRows.length > 0 && (
              <div className="mt-3 text-sm text-gray-700">
                Parsed <strong>{uploadedRows.length}</strong> valid rows.
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Processing..." : "Generate Forecast"}
          </button>
          <button
            onClick={() => {
              setRows([{ date: "", price: "", quantity: "" }]);
              setUploadedRows([]);
              setResult(null);
              setError("");
            }}
            className="bg-gray-100 px-3 py-2 rounded"
          >
            Reset
          </button>
        </div>

        {error && <div className="mt-3 text-red-600">{error}</div>}

        {result && (
          <div className="mt-6">
            <h2 className="font-semibold mb-2">Results</h2>
            <div className="bg-gray-50 p-3 rounded">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Base Insight</h3>
                  <p className="text-sm">{result.insight}</p>
                </div>
                <div>
                  <h3 className="font-medium">AI Insight</h3>
                  <p className="text-sm">{result.aiInsight}</p>
                </div>
              </div>

              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataFromResult()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#2563eb"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <details className="mt-4 bg-white p-2 rounded">
                <summary className="cursor-pointer">Raw JSON</summary>
                <pre className="mt-2 text-xs overflow-auto max-h-48">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
