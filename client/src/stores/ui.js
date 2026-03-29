import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useUiStore = defineStore("ui", () => {
  const inFlight = ref(0);
  const isLoading = computed(() => inFlight.value > 0);
  const menuOpen = ref(false);

  function beginRequest() {
    inFlight.value += 1;
  }

  function endRequest() {
    inFlight.value = Math.max(0, inFlight.value - 1);
  }

  function toggleMenu() {
    menuOpen.value = !menuOpen.value;
  }

  function closeMenu() {
    menuOpen.value = false;
  }

  return { isLoading, beginRequest, endRequest, menuOpen, toggleMenu, closeMenu };
});
