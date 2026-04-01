<template>
  <div class="delay-gateway">
    <!-- Fragmented Grid Container -->
    <div class="fragmented-grid-wrapper">
      <div class="fragmented-grid">
        <div
          v-for="(photo, index) in displayPhotos"
          :key="`${photo.id}-${index}`"
          class="grid-item"
          :style="getGridStyle(index)"
        >
          <img
            :src="photo.url"
            :alt="photo.title || `Photo ${index + 1}`"
            class="grid-image"
            loading="lazy"
          />
          <div class="image-meta">
            <p v-if="photo.title" class="meta-title">{{ photo.title }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Grain/Noise Overlay -->
    <div class="grain-overlay"></div>

    <!-- Text Overlay -->
    <div class="text-overlay">
      <div class="subtext">愛 密 集</div>
    </div>

    <!-- Fade-in Foreground (for depth) -->
    <div class="foreground-veil"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const photos = ref([])
const fallbackPhotos = [
  {
    id: 'unsplash-1',
    url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
    title: 'Monochrome Whisper'
  },
  {
    id: 'unsplash-2',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
    title: 'Urban Echo'
  },
  {
    id: 'unsplash-3',
    url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
    title: 'Textured Reality'
  },
  {
    id: 'unsplash-4',
    url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80',
    title: 'Fragmented Time'
  },
  {
    id: 'unsplash-5',
    url: 'https://images.unsplash.com/photo-1516307365439-a7e3e9bcdc3e?w=800&q=80',
    title: 'Silent Geometry'
  },
  {
    id: 'unsplash-6',
    url: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=800&q=80',
    title: 'Contemplation'
  },
  {
    id: 'unsplash-7',
    url: 'https://images.unsplash.com/photo-1495804186990-130e7623f72f?w=800&q=80',
    title: 'Abstract Shadows'
  },
  {
    id: 'unsplash-8',
    url: 'https://images.unsplash.com/photo-1471341990063-16afc2186efb?w=800&q=80',
    title: 'Ephemeral Frame'
  },
  {
    id: 'unsplash-9',
    url: 'https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=800&q=80',
    title: 'Layered Moments'
  },
  {
    id: 'unsplash-10',
    url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80',
    title: 'Drift'
  },
  {
    id: 'unsplash-11',
    url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80',
    title: 'Crystalline'
  },
  {
    id: 'unsplash-12',
    url: 'https://images.unsplash.com/photo-1512533382944-ec42a01a8ee9?w=800&q=80',
    title: 'Nocturne'
  }
]

// Asymmetric grid configurations
const gridConfigurations = [
  { cols: 'span 3', rows: 'span 2' },
  { cols: 'span 4', rows: 'span 1' },
  { cols: 'span 2', rows: 'span 3' },
  { cols: 'span 3', rows: 'span 2' },
  { cols: 'span 5', rows: 'span 1' },
  { cols: 'span 2', rows: 'span 2' },
  { cols: 'span 4', rows: 'span 2' },
  { cols: 'span 3', rows: 'span 1' },
  { cols: 'span 2', rows: 'span 4' },
  { cols: 'span 3', rows: 'span 2' },
  { cols: 'span 4', rows: 'span 1' },
  { cols: 'span 2', rows: 'span 2' }
]

const displayPhotos = computed(() => {
  const source = photos.value.length > 0 ? photos.value : fallbackPhotos
  // Duplicate for seamless falling animation
  return [...source, ...source]
})

const getGridStyle = (index) => {
  const config = gridConfigurations[index % gridConfigurations.length]
  return {
    gridColumn: config.cols,
    gridRow: config.rows
  }
}

onMounted(async () => {
  try {
    const response = await fetch('/api/photos/featured')
    if (response.ok) {
      photos.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching featured photos:', error)
    // Fallback photos already set
  }
})
</script>

<style scoped>
/* Base Container */
.delay-gateway {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #050505;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Fragmented Grid Wrapper & Animation */
.fragmented-grid-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 200%;
  overflow: hidden;
  animation: scroll-down 90s linear infinite;
}

@keyframes scroll-down {
  0% {
    transform: translateY(-50%);
  }
  100% {
    transform: translateY(0);
  }
}

/* Main Grid Container */
.fragmented-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 2rem;
  padding: 4rem;
  height: 100%;
  width: 100%;
}

/* Grid Items (Asymmetric Layout) */
.grid-item {
  position: relative;
  overflow: hidden;
  background: #0a0a0a;
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.grid-item:hover {
  border-color: rgba(255, 255, 255, 0.3);
  z-index: 10;
}

/* Image Styling */
.grid-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(100%) contrast(1.5) brightness(0.5);
  opacity: 0.25;
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: block;
}

.grid-item:hover .grid-image {
  opacity: 0.8;
  filter: grayscale(70%) contrast(1.8) brightness(0.9);
  transform: scale(1.02);
}

/* Image Metadata */
.image-meta {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  padding: 1.5rem 1rem;
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
}

.grid-item:hover .image-meta {
  opacity: 1;
}

.meta-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
  font-weight: 300;
  letter-spacing: 2px;
  margin: 0;
  text-transform: uppercase;
}

/* Grain Overlay */
.grain-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
  opacity: 0.3;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='400' fill='white'/%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='400' height='400' fill='white' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  background-repeat: repeat;
}

/* Text Overlay - Editorial Fragment */
.text-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 3;
  text-align: center;
}

.editorial-text {
  display: flex;
  gap: 0.5vw;
  justify-content: center;
  align-items: center;
}

.text-fragment {
  font-size: 12vw;
  font-weight: 200;
  letter-spacing: 0.15em;
  color: rgba(255, 255, 255, 0.75);
  mix-blend-mode: difference;
  white-space: nowrap;
  animation: float-in 1.5s ease-out forwards;
  opacity: 0;
}

@keyframes float-in {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.subtext {
  margin-top: 2rem;
  font-size: 3rem;
  letter-spacing: 3px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  font-weight: 300;
  animation: fade-in 2s ease-out forwards;
  opacity: 0;
  animation-delay: 0.6s;
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

/* Foreground Veil - Creates Depth */
.foreground-veil {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30%;
  background: linear-gradient(to top, rgba(5, 5, 5, 0.8), transparent);
  pointer-events: none;
  z-index: 4;
}

/* Responsive Adjustments */
@media (max-width: 1024px) {
  .fragmented-grid {
    gap: 1.5rem;
    padding: 2rem;
  }

  .editorial-text {
    gap: 0.3vw;
  }

  .text-fragment {
    font-size: 10vw;
  }

  .subtext {
    font-size: 0.75rem;
  }
}

@media (max-width: 768px) {
  .fragmented-grid {
    gap: 1rem;
    padding: 1.5rem;
    grid-template-columns: repeat(6, 1fr);
  }

  .grid-item {
    grid-column: span 3 !important;
    grid-row: span 2 !important;
  }

  .text-fragment {
    font-size: 8vw;
  }

  .subtext {
    font-size: 0.65rem;
  }
}

@media (max-width: 480px) {
  .fragmented-grid {
    gap: 0.8rem;
    padding: 1rem;
  }

  .text-fragment {
    font-size: 6vw;
  }
}
</style>