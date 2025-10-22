import { useState } from "react";

export default function ManualEntry({ onSubmit }) {
  const [rows, setRows] = useState([{ date: "", price: "", quantity: "" }]);

  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const addRow = () =>
    setRows([...rows, { date: "", price: "", quantity: "" }]);
  const handleSubmit = () => onSubmit({ data: rows });

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-2">Manual Data Entry</h2>
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-3 gap-2 mb-2">
          <input
            type="date"
            value={row.date}
            onChange={(e) => handleChange(i, "date", e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Price"
            value={row.price}
            onChange={(e) => handleChange(i, "price", e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Quantity"
            value={row.quantity}
            onChange={(e) => handleChange(i, "quantity", e.target.value)}
            className="border p-2 rounded"
          />
        </div>
      ))}
      <button onClick={addRow} className="bg-gray-200 px-3 py-1 rounded mr-2">
        ➕ Add Row
      </button>
      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-1 rounded"
      >
        Submit
      </button>
    </div>
  );
}
