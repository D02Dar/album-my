import axios from "axios";

const raw = import.meta.env.VITE_API_BASE_URL;
const trimmed =
  typeof raw === "string" && raw.trim() !== "" ? raw.trim().replace(/\/$/, "") : "";

const api = axios.create({
  ...(trimmed ? { baseURL: trimmed } : {}),
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export default api;
