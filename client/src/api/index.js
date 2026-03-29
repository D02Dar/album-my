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
  // 从 localStorage 获取 token 并添加到请求头
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // FormData 时删除 Content-Type，让浏览器自动设置 boundary
  if (config.data instanceof FormData) {
    // 删除所有 Content-Type，让 axios 自动处理
    delete config.headers["Content-Type"];
  }
  return config;
});

export default api;
