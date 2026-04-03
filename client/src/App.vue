<script setup>
import { RouterLink, RouterView } from "vue-router";
import { useUiStore } from "./stores/ui";
import OverlayMenu from "./components/OverlayMenu.vue";

const ui = useUiStore();
</script>

<template>
  <div class="app-root">
    <header class="global-header">
      <RouterLink to="/" class="site-title">
        <span class="title-text">DWT</span>
      </RouterLink>
      <button
        class="menu-btn"
        @click="ui.toggleMenu"
        :aria-expanded="ui.menuOpen"
        aria-label="Toggle menu"
      >
        {{ ui.menuOpen ? "×" : "MENU" }}
      </button>
    </header>

    <OverlayMenu />

    <RouterView />

    <Transition name="fade">
      <div v-if="ui.isLoading" class="loading-overlay" aria-live="polite" aria-busy="true">
        <div class="loading-spinner" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app-root {
  min-height: 100vh;
  position: relative;
  background: #111111;
}

.global-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 4%;
  border-bottom: 1px solid #1e1e1e;
  position: sticky;
  top: 0;
  z-index: 100;
  background: #111111;
}

.site-title {
  font-size: 0.58rem;
  font-weight: 400;
  letter-spacing: 0.55em;
  text-transform: uppercase;
  border: none;
  padding: 0;
  color: #555;
  transition: color 0.2s ease;
  line-height: 1;
}

.site-title:hover { color: #ccc; }
.title-text { display: block; }

.menu-btn {
  font-size: 0.6rem;
  font-weight: 400;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #555;
  background: transparent;
  border: 1px solid #222;
  padding: 0.45rem 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 0;
  line-height: 1.2;
}

.menu-btn:hover {
  color: #ccc;
  border-color: #666;
}

.menu-btn[aria-expanded="true"] {
  color: #ccc;
  border-color: #555;
}

.loading-overlay {
  position: fixed; inset: 0; z-index: 9998;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.5);
}

.loading-spinner {
  width: 22px; height: 22px;
  border: 1.5px solid rgba(238,238,238,0.15);
  border-top-color: #eeeeee;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>