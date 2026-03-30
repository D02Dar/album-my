import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "../api";

const STORAGE_KEY = "photogallery_auth_v1";
const TOKEN_KEY = "token";

export const useAuthStore = defineStore("auth", () => {
  const currentUser = ref(null);

  function hydrateFromStorage() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) currentUser.value = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  function persistUser(user) {
    currentUser.value = user;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  function clearLocal() {
    currentUser.value = null;
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  const isAuthenticated = computed(() => !!currentUser.value);

  async function login(email, password) {
    const { data } = await api.post("/api/auth/login", { email, password });
    
    // 保存 user 信息到 sessionStorage
    persistUser(data.user);
    
    // 保存 token 到 localStorage（用于 API 请求头）
    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
  }

  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* still clear client */
    }
    clearLocal();
  }

  hydrateFromStorage();

  return {
    currentUser,
    isAuthenticated,
    login,
    logout,
    hydrateFromStorage,
    clearLocal,
  };
});
