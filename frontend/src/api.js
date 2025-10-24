import axios from "axios";

const API_BASE = "http://localhost:4000";

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
