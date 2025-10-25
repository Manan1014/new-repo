import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const uploadSalesData = async (data) => {
  const res = await api.post("/api/forecast", data);
  return res.data;
};

export const testDatabase = async () => {
  const res = await api.get("/api/test-db");
  return res.data;
};

export const getData = async () => {
  const res = await api.get("/api/data");
  return res.data;
};

export const getUserProfile = async () => {
  const res = await api.get("/api/user/profile");
  return res.data;
};

export const updateUserProfile = async (profileData) => {
  const res = await api.put("/api/user/profile", profileData);
  return res.data;
};

export const changePassword = async (passwordData) => {
  const res = await api.put("/api/user/password", passwordData);
  return res.data;
};

export const getUserPreferences = async () => {
  const res = await api.get("/api/user/preferences");
  return res.data;
};

export const updateUserPreferences = async (preferences) => {
  const res = await api.put("/api/user/preferences", preferences);
  return res.data;
};

export const deleteUserAccount = async (password) => {
  const res = await api.delete("/api/user/account", { data: { password } });
  return res.data;
};

// Analytics API endpoints
export const getAnalyticsSummary = async () => {
  const res = await api.get("/api/analytics/summary");
  return res.data;
};

export const getAnalyticsTrends = async () => {
  const res = await api.get("/api/analytics/trends");
  return res.data;
};

export const getAnalyticsCategories = async () => {
  const res = await api.get("/api/analytics/categories");
  return res.data;
};

export const getAnalyticsInsights = async () => {
  const res = await api.get("/api/analytics/insights");
  return res.data;
};

// Auth API endpoints
export const loginUser = async (email, password) => {
  const res = await api.post("/api/auth/login", { email, password });
  return res.data;
};

export const registerUser = async (name, email, password) => {
  const res = await api.post("/api/auth/register", { name, email, password });
  return res.data;
};

export const verifyToken = async (token) => {
  const res = await api.post("/api/auth/verify", { token });
  return res.data;
};

// Monthly Data API endpoints
export const getMonthlyData = async (year = null, month = null) => {
  const params = {};
  if (year) params.year = year;
  if (month) params.month = month;
  const res = await api.get("/api/monthly-data", { params });
  return res.data;
};

export const getMonthTransactions = async (year, month) => {
  const res = await api.get(`/api/monthly-data/${year}/${month}/transactions`);
  return res.data;
};

export const deleteMonthlyData = async (year, month) => {
  const res = await api.delete(`/api/monthly-data/${year}/${month}`);
  return res.data;
};

// Download analytics report (PDF)
export const downloadAnalyticsReport = async () => {
  const response = await api.get("/api/analytics/report", {
    responseType: "blob",
  });

  // response.data is already a blob when using responseType: "blob"
  const blob = response.data;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `analytics-report-${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
