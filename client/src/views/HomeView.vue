<script setup>
import { ref, onMounted } from "vue";
import { useGalleryStore } from "../stores/gallery";
import { getProxyImageUrl } from "../utils/imageProxy";

const gallery = useGalleryStore();
const featuredPhotos = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    featuredPhotos.value = await gallery.fetchFeatured();
  } catch (e) {
    console.error("Failed to load featured photos:", e);
  } finally {
    loading.value = false;
  }
});

// 定义网格的 span 规则以创建 bento 布局变化
function getGridSpan(index) {
  const spans = [
    { row: 2, col: 2 }, // 0
    { row: 1, col: 1 }, // 1
    { row: 1, col: 1 }, // 2
    { row: 2, col: 1 }, // 3
    { row: 1, col: 2 }, // 4
    { row: 1, col: 1 }, // 5
    { row: 2, col: 2 }, // 6
    { row: 1, col: 1 }, // 7
  ];
  return spans[index % spans.length];
}
</script>

<template>
  <div class="home-view">
    <!-- Editorial Bento Grid -->
    <div class="editorial-grid">
      <div
        v-for="(photo, index) in featuredPhotos"
        :key="photo.id"
        class="grid-cell"
        :style="{
          'grid-column': `span ${getGridSpan(index).col}`,
          'grid-row': `span ${getGridSpan(index).row}`,
        }"
      >
        <div class="grid-image-wrapper">
          <img
            :src="getProxyImageUrl(photo.url)"
            :alt="photo.title || 'Featured photo'"
            class="grid-image"
          />
          <div class="grid-overlay" />
        </div>
        <div v-if="photo.title" class="grid-caption">
          {{ photo.title }}
        </div>
      </div>

      <!-- 如果没有图片，显示占位符 -->
      <div v-if="featuredPhotos.length === 0" class="grid-empty">
        <p class="empty-text">No featured photos yet</p>
        <p class="empty-subtext">Visit the gallery to add images to the home page</p>
      </div>
    </div>

    <!-- Hero Typography Overlay -->
    <div class="hero-typography">
      <div class="hero-main">
        <span class="hero-line">MORIYAMA</span>
        <span class="hero-line">EDITORIAL</span>
      </div>
      <div class="hero-corner hero-corner--top-right">
        <span class="corner-text">MENU</span>
      </div>
      <div class="hero-corner hero-corner--bottom-left">
        <span class="corner-text small">PHOTO ESSAY</span>
      </div>
      <div class="hero-corner hero-corner--bottom-right">
        <span class="corner-text small">©2024</span>
      </div>
    </div>

    <!-- Grain texture overlay -->
    <div class="grain-texture" />

    <!-- Load indicator -->
    <div v-if="loading" class="loading-indicator">
      <div class="spinner" />
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600&display=swap');

.home-view {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #0a0a0a;
  overflow: hidden;
  margin-left: calc(-50vw + 50%);
}

/* Editorial Grid */
.editorial-grid {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 2px;
  background-color: #0a0a0a;
  z-index: 1;
  overflow: hidden;
}

/* Grid cells */
.grid-cell {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.grid-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.grid-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* CRITICAL: Heavily darken images */
  filter: grayscale(100%) brightness(0.3) contrast(1.2);
  transition: filter 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  display: block;
  background: #000;
}

/* Hover effect: brighten and scale */
.grid-cell:hover .grid-image {
  filter: grayscale(100%) brightness(0.5) contrast(1.3);
  transform: scale(1.03);
}

/* Grid overlay for depth */
.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0) 50%,
    rgba(0, 0, 0, 0.2) 100%
  );
  pointer-events: none;
}

/* Grid caption */
.grid-caption {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  right: 1rem;
  font-size: 0.8rem;
  color: #fff;
  font-weight: 300;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.grid-cell:hover .grid-caption {
  opacity: 1;
}

/* Empty state */
.grid-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 100;
  color: #666;
}

.empty-text {
  font-size: 1.5rem;
  font-weight: 300;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.empty-subtext {
  font-size: 0.85rem;
  color: #555;
  letter-spacing: 0.02em;
}

/* Hero Typography Overlay */
.hero-typography {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.hero-main {
  position: fixed;
  top: 50%;
  left: 5%;
  transform: translateY(-50%);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 8rem;
  font-weight: 200;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.08);
  line-height: 0.95;
  text-transform: uppercase;
  user-select: none;
}

.hero-line {
  display: block;
}

/* Corner typography */
.hero-corner {
  position: fixed;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.15);
  font-weight: 300;
  font-family: 'Space Grotesk', sans-serif;
  user-select: none;
}

.hero-corner--top-right {
  top: 2.5rem;
  right: 2.5rem;
}

.hero-corner--bottom-left {
  bottom: 2.5rem;
  left: 2.5rem;
}

.hero-corner--bottom-right {
  bottom: 2.5rem;
  right: 2.5rem;
}

.corner-text {
  display: block;
}

.corner-text.small {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.1);
  margin-top: 0.3rem;
}

/* Grain texture overlay */
.grain-texture {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' /%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noiseFilter)' opacity='0.06'/%3E%3C/svg%3E");
  background-size: 300px 300px;
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: 11;
  opacity: 0.2;
}

/* Loading indicator */
.loading-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top: 2px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .editorial-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }

  .hero-main {
    font-size: 5rem;
    left: 3%;
  }

  .hero-corner {
    font-size: 0.65rem;
  }

  .hero-corner--top-right {
    top: 2rem;
    right: 2rem;
  }

  .hero-corner--bottom-left {
    bottom: 2rem;
    left: 2rem;
  }

  .hero-corner--bottom-right {
    bottom: 2rem;
    right: 2rem;
  }
}

@media (max-width: 768px) {
  .editorial-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 1px;
  }

  .hero-main {
    font-size: 3rem;
    left: 2%;
    top: 45%;
    letter-spacing: 0.02em;
  }

  .hero-corner {
    font-size: 0.55rem;
  }

  .hero-corner--top-right {
    top: 1.5rem;
    right: 1.5rem;
  }

  .hero-corner--bottom-left {
    bottom: 1.5rem;
    left: 1.5rem;
  }

  .hero-corner--bottom-right {
    bottom: 1.5rem;
    right: 1.5rem;
  }

  .grid-caption {
    font-size: 0.7rem;
    bottom: 0.75rem;
    left: 0.75rem;
  }

  .empty-text {
    font-size: 1.2rem;
  }

  .empty-subtext {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .editorial-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 1px;
  }

  .hero-main {
    font-size: 2rem;
    left: 1.5%;
    letter-spacing: 0.01em;
  }

  .hero-corner {
    font-size: 0.5rem;
  }

  .hero-corner--top-right {
    top: 1rem;
    right: 1rem;
  }

  .hero-corner--bottom-left {
    bottom: 1rem;
    left: 1rem;
  }

  .hero-corner--bottom-right {
    bottom: 1rem;
    right: 1rem;
  }

  .grid-caption {
    font-size: 0.6rem;
    bottom: 0.5rem;
    left: 0.5rem;
    right: 0.5rem;
  }

  .empty-text {
    font-size: 1rem;
  }

  .empty-subtext {
    font-size: 0.65rem;
  }
}
</style>