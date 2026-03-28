import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useUiStore = defineStore("ui", () => {
  const inFlight = ref(0);
  const isLoading = computed(() => inFlight.value > 0);

  function beginRequest() {
    inFlight.value += 1;
  }

  function endRequest() {
    inFlight.value = Math.max(0, inFlight.value - 1);
  }

  return { isLoading, beginRequest, endRequest };
});
