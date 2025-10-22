import React, { useState } from "react";

const SalesInput = ({ onSubmit }) => {
  const [rows, setRows] = useState([{ date: "", price: "", quantity: "" }]);

  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const addRow = () => {
    setRows([...rows, { date: "", price: "", quantity: "" }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(rows);
  };

  return (
    <form onSubmit={handleSubmit}>
      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Price</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>
                <input
                  type="date"
                  value={r.date}
                  onChange={(e) => handleChange(i, "date", e.target.value)}
                  required
                />
              </td>
              <td>
                <input
                  type="number"
                  value={r.price}
                  onChange={(e) => handleChange(i, "price", e.target.value)}
                  required
                />
              </td>
              <td>
                <input
                  type="number"
                  value={r.quantity}
                  onChange={(e) => handleChange(i, "quantity", e.target.value)}
                  required
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={addRow} style={{ marginTop: 10 }}>
        ➕ Add Row
      </button>
      <br />
      <button type="submit" style={{ marginTop: 10 }}>
        🚀 Generate Forecast
      </button>
    </form>
  );
};

export default SalesInput;
