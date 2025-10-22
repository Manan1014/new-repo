import React, { useState } from "react";

export default function UploadForm({ onUpload, loading, message }) {
  const [fileName, setFileName] = useState("");

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      onUpload(text);
    };
    reader.readAsText(file);
  };

  const loadDemo = () => {
    // small demo CSV — you can replace with a file
    const demo = `date,product,region,quantity,price
2025-01-01,Phone,North,3,499.99
2025-01-05,Laptop,East,1,999.99
2025-02-10,Headphones,West,5,49.99
2025-03-15,Phone,South,2,499.99
`;
    onUpload(demo);
    setFileName("demo.csv");
  };

  return (
    <div className="upload-card">
      <label className="file-input">
        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          disabled={loading}
        />
        <span>{fileName || "Choose CSV file"}</span>
      </label>
      <div className="upload-actions">
        <button onClick={loadDemo} disabled={loading}>
          Load Demo Data
        </button>
        <small className="hint">
          CSV columns: date,product,region,quantity,price
        </small>
      </div>
      <div className="status">
        <strong>Status:</strong> {message || "No action yet"}
      </div>
    </div>
  );
}
