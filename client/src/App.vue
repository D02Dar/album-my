<script setup>
import { RouterView } from "vue-router";
import { useUiStore } from "./stores/ui";

const ui = useUiStore();
</script>

<template>
  <div class="app-root">
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
}

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
</style>
