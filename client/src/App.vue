<script setup>
import { RouterLink, RouterView } from "vue-router";
import { useUiStore } from "./stores/ui";
import OverlayMenu from "./components/OverlayMenu.vue";

const ui = useUiStore();
</script>

<template>
  <div class="app-root">
    <!-- Global Header -->
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
        X
      </button>
    </header>

    <!-- Overlay Navigation Menu -->
    <OverlayMenu />

    <!-- Main Content -->
    <RouterView />

    <!-- Loading Overlay -->
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

/* Global Header */
.global-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 3rem 5%;
  border-bottom: 1px solid #333;
  position: sticky;
  top: 0;
  z-index: 100;
  background: #111111;
}

.site-title {
  font-size: 0.55rem;
  font-weight: 400;
  letter-spacing: 0.6em;
  text-transform: uppercase;
  border: none;
  padding: 0;
  color: #666;
  transition: color 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.3rem;
  line-height: 1;
}

.site-title:hover {
  color: #fff;
}

.title-text {
  display: block;
}

.menu-btn {
  font-size: 0.65rem;
  font-weight: 400;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #666;
  background: transparent;
  border: 1px solid #333;
  padding: 0.6rem 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 0;
}

.menu-btn:hover {
  color: #fff;
  border-color: #999;
}

.menu-btn[aria-expanded="true"] {
  color: #fff;
  border-color: #666;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 2px solid rgba(238, 238, 238, 0.2);
  border-top-color: #eeeeee;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
