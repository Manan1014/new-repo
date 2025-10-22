import axios from "axios";

const API_BASE = "http://localhost:4000";

export const uploadSalesData = async (data) => {
  const res = await axios.post(`${API_BASE}/api/forecast`, { data });
  return res.data;
};
