import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import api from "./api";
import { useUiStore } from "./stores/ui";
import "./style.css";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

const ui = useUiStore();

api.interceptors.request.use((config) => {
  ui.beginRequest();
  return config;
});

api.interceptors.response.use(
  (response) => {
    ui.endRequest();
    return response;
  },
  (error) => {
    ui.endRequest();
    return Promise.reject(error);
  }
);

app.mount("#app");
