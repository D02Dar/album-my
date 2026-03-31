<script setup>
import { ref, computed } from "vue";

// Generate grid items for the grain portal
const gridSize = 20;
const gridItems = computed(() => {
  return Array.from({ length: gridSize * 12 }, (_, i) => ({
    id: i,
    opacity: Math.random() * 0.3 + 0.1,
  }));
});
</script>

<template>
  <div class="grain-portal">
    <!-- Falling grain background grid -->
    <div class="grid-container">
      <div
        v-for="item in gridItems"
        :key="item.id"
        class="grid-item"
        :style="{ '--item-opacity': item.opacity }"
      />
    </div>

    <!-- Grain texture overlay -->
    <div class="grain-overlay" />

    <!-- Bottom Left Metadata -->
    <div class="metadata metadata--bottom-left">
      <p class="metadata__text">SHINJUKU, TOKYO</p>
      <p class="metadata__text metadata__text--small">35.6895° N, 139.6917° E</p>
    </div>

    <!-- Bottom Right Copyright -->
    <div class="metadata metadata--bottom-right">
      <p class="metadata__text metadata__text--copyright">©2024</p>
    </div>
  </div>
</template>

<style scoped>
.grain-portal {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #0d0d0d;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: calc(-50vw + 50%);
}

/* CSS Grid animation container */
.grid-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(20, 1fr);
  grid-template-rows: repeat(12, 1fr);
  gap: 0;
  overflow: hidden;
  animation: grain-fall 20s linear infinite;
  z-index: 1;
}

@keyframes grain-fall {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(100%);
  }
}

/* Individual grid items */
.grid-item {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, var(--item-opacity)),
    rgba(255, 255, 255, calc(var(--item-opacity) * 0.5))
  );
  border: 0.5px solid #474747;
  transition: background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.grid-item:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, min(0.4, calc(var(--item-opacity) + 0.25))),
    rgba(255, 255, 255, calc(min(0.4, var(--item-opacity) + 0.25) * 0.5))
  );
}

/* Grain texture overlay */
.grain-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
  background-size: 400px 400px;
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: 2;
  opacity: 0.3;
  animation: grain-texture-shimmer 4s ease-in-out infinite;
}

@keyframes grain-texture-shimmer {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.5;
  }
}

/* Metadata styling */
.metadata {
  position: fixed;
  z-index: 10;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #ffffff;
  font-weight: 300;
  line-height: 1.4;
}

.metadata--bottom-left {
  bottom: 2.5rem;
  left: 2.5rem;
}

.metadata--bottom-right {
  bottom: 2.5rem;
  right: 2.5rem;
}

.metadata__text {
  margin: 0;
  padding: 0;
}

.metadata__text--small {
  font-size: 0.65rem;
  color: #999999;
  margin-top: 0.3rem;
}

.metadata__text--copyright {
  font-size: 0.65rem;
  color: #666666;
}

/* Responsive design */
@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: repeat(10, 1fr);
  }

  .metadata {
    font-size: 0.6rem;
  }

  .metadata--bottom-left,
  .metadata--bottom-right {
    bottom: 1.5rem;
  }

  .metadata--bottom-left {
    left: 1.5rem;
  }

  .metadata--bottom-right {
    right: 1.5rem;
  }

  .metadata__text--small {
    font-size: 0.55rem;
  }

  .metadata__text--copyright {
    font-size: 0.55rem;
  }
}

@media (max-width: 480px) {
  .grid-container {
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(8, 1fr);
  }

  .grid-item {
    border: 0.5px solid #474747;
  }

  .metadata {
    font-size: 0.55rem;
  }

  .metadata--bottom-left,
  .metadata--bottom-right {
    bottom: 1rem;
  }

  .metadata--bottom-left {
    left: 1rem;
  }

  .metadata--bottom-right {
    right: 1rem;
  }

  .metadata__text--small {
    font-size: 0.5rem;
  }

  .metadata__text--copyright {
    font-size: 0.5rem;
  }
}
</style>
