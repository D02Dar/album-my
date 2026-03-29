<script setup>
import { useAuthStore } from "../stores/auth";
import GalleryAccordion from "../components/GalleryAccordion.vue";

const auth = useAuthStore();
</script>

<template>
  <div class="home">
    <GalleryAccordion />
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background: #111111;
}
</style>
