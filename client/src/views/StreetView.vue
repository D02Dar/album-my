<script setup>
import { onMounted } from "vue";
import { useUiStore } from "../stores/ui";

const ui = useUiStore();

onMounted(() => {
  document.title = "Street - Photo Gallery";
});
</script>

<template>
  <main class="street-view">
    <div class="content-wrapper">
      <h1 class="page-title">STREET</h1>
      <div class="page-description">
        <p>Urban explorations and street photography collection.</p>
      </div>
      <div class="gallery-grid">
        <!-- Placeholder for street photos -->
        <div class="gallery-item placeholder">Coming Soon</div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.street-view {
  min-height: 100vh;
  background: #111111;
  padding: 6rem 5% 4rem;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 3.5rem;
  font-weight: 300;
  letter-spacing: 0.1em;
  color: #fff;
  margin-bottom: 2rem;
  text-transform: uppercase;
}

.page-description {
  font-size: 0.95rem;
  color: #999;
  margin-bottom: 3rem;
  max-width: 600px;
  line-height: 1.6;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.gallery-item {
  aspect-ratio: 1;
  background: #1a1a1a;
  border: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 0.9rem;
}

.placeholder {
  padding: 2rem;
  text-align: center;
  min-height: 300px;
}

@media (max-width: 768px) {
  .street-view {
    padding: 4rem 5% 3rem;
  }

  .page-title {
    font-size: 2rem;
  }
}
</style>
