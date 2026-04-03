<template>
  <div class="home">

    <!-- ── Scrolling photo grid ─────────────────────────────────────────── -->
    <div class="grid-wrapper">
      <div class="fragmented-grid" :style="{ '--cols': gridCols }">
        <div
          v-for="(photo, index) in displayPhotos"
          :key="`${photo.id}-${index}`"
          class="grid-item"
          :style="getGridStyle(index)"
        >
          <img
            :src="photo.url"
            :alt="photo.title || ''"
            class="grid-image"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>

    <!-- ── Grain texture ────────────────────────────────────────────────── -->
    <div class="grain" aria-hidden="true"></div>

    <!-- ── Vignette edges ───────────────────────────────────────────────── -->
    <div class="vignette" aria-hidden="true"></div>

    <!-- ── Hero title ───────────────────────────────────────────────────── -->
    <div class="hero" aria-label="C'est la vie">

      <!-- Vertical side label left -->
      <span class="side-label side-label--left" aria-hidden="true">
        FRAGMENTS · OF · TIME
      </span>

      <!-- Main title block -->
      <div class="title-block">
        <!-- Decorative rule -->
        <div class="rule rule--top"></div>

        <!-- CJK characters — each glows independently -->
        <h1 class="title-cjk">
          <span class="char" style="--i:0">C'est</span>
          <span class="char-sep" aria-hidden="true">·</span>
          <span class="char" style="--i:1">la</span>
          <span class="char-sep" aria-hidden="true">·</span>
          <span class="char" style="--i:2">vie</span>
        </h1>

        <!-- English subtitle — tracked wide, fades in after CJK -->
        <p class="title-sub">愛 密 集</p>

        <!-- Decorative rule -->
        <div class="rule rule--bottom"></div>

        <!-- Tiny index label -->
        <span class="title-index" aria-hidden="true">VOL. 01</span>
      </div>

      <!-- Vertical side label right -->
      <span class="side-label side-label--right" aria-hidden="true">
        SPACE &amp; MEMORY
      </span>

    </div>

    <!-- ── Bottom fade ──────────────────────────────────────────────────── -->
    <div class="bottom-fade" aria-hidden="true"></div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

// ── Grid configuration ────────────────────────────────────────────────────
// Asymmetric span pairs: [colSpan, rowSpan]
// Keep total col-spans per "visual row" ≈ 12 so the grid stays balanced
const SPANS = [
  [3, 2], [4, 1], [2, 3], [3, 2],
  [5, 1], [2, 2], [4, 2], [3, 1],
  [2, 4], [3, 2], [4, 1], [2, 2],
];

// Fallback photos used when the user hasn't featured any yet
const FALLBACK = [
  { id: "f1", url: "https://images.unsplash.com/photo-1549488331-48350163359d?w=800&q=80", title: "" },
  { id: "f2", url: "https://images.unsplash.com/photo-1563220473-b265691d1e4e?w=800&q=80", title: "" },
  { id: "f3", url: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80", title: "" },
  { id: "f4", url: "https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?w=1000&q=80", title: "" },
  { id: "f5", url: "https://images.unsplash.com/photo-1628189689408-592a3b022143?w=800&q=80", title: "" },
  { id: "f6", url: "https://images.unsplash.com/photo-1551334787-21e6bd3ab135?w=800&q=80", title: "" },
  { id: "f7", url: "https://images.unsplash.com/photo-1511407397940-d57f68e81203?w=800&q=80", title: "" },
  { id: "f8", url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80", title: "" },
  { id: "f9", url: "https://images.unsplash.com/photo-1512533382944-ec42a01a8ee9?w=800&q=80", title: "" },
  { id: "f10", url: "https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=800&q=80", title: "" },
  { id: "f11", url: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&q=80", title: "" },
  { id: "f12", url: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80", title: "" },
];

// ── State ─────────────────────────────────────────────────────────────────
const featuredPhotos = ref([]);
const gridCols = ref(12);

// ── Responsive column count ───────────────────────────────────────────────
function updateCols() {
  gridCols.value = window.innerWidth <= 600 ? 6
    : window.innerWidth <= 1024 ? 9
    : 12;
}

// ── Photos source ─────────────────────────────────────────────────────────
// Duplicate the array so the seamless-scroll animation has enough material
const displayPhotos = computed(() => {
  const src = featuredPhotos.value.length > 0 ? featuredPhotos.value : FALLBACK;
  // Need at least 2 full copies for the seamless loop
  const copies = Math.ceil(24 / src.length) + 1;
  return Array.from({ length: copies }, () => src).flat();
});

function getGridStyle(index) {
  const [cols, rows] = SPANS[index % SPANS.length];
  return {
    gridColumn: `span ${Math.min(cols, gridCols.value)}`,
    gridRow: `span ${rows}`,
  };
}

// ── Data fetching ─────────────────────────────────────────────────────────
async function loadFeatured() {
  try {
    const res = await fetch("/api/photos/featured");
    if (!res.ok) return;
    const json = await res.json();
    // Backend returns { photos: [...] }
    const photos = Array.isArray(json) ? json : (json.photos ?? []);
    if (photos.length > 0) {
      featuredPhotos.value = photos;
    }
  } catch {
    // silently fall back to FALLBACK photos
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────
onMounted(() => {
  loadFeatured();
  updateCols();
  window.addEventListener("resize", updateCols, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("resize", updateCols);
});
</script>

<style scoped>
/* ── Base ────────────────────────────────────────────────────────────────── */
.home {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #050505;
}

/* ── Scrolling grid ──────────────────────────────────────────────────────── */
.grid-wrapper {
  position: absolute;
  inset: 0;
  /* Double height so the clone can scroll into view seamlessly */
  height: 200%;
  animation: drift 120s linear infinite;
}

@keyframes drift {
  from { transform: translateY(-50%); }
  to   { transform: translateY(0); }
}

.fragmented-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols, 12), 1fr);
  /* Auto-place items into auto rows sized to roughly 16vh each */
  grid-auto-rows: 16vh;
  gap: 3px;
  width: 100%;
  height: 100%;
}

.grid-item {
  overflow: hidden;
  background: #111;
  /* Subtle entrance — items fade up as they enter the animated grid */
  animation: cell-in 0.6s ease both;
  animation-delay: calc(var(--item-i, 0) * 0.04s);
}

@keyframes cell-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.grid-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* Start very dark; hover in .grid-item lifts it slightly */
  filter: grayscale(100%) brightness(0.4) contrast(1.0);
  transition: filter 1.2s ease, transform 1.2s ease;
  display: block;
}

.grid-item:hover .grid-image {
  filter: grayscale(60%) brightness(0.6) contrast(1.3);
  transform: scale(1.04);
}

/* ── Grain ───────────────────────────────────────────────────────────────── */
.grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  opacity: 0.22;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E");
  background-size: 220px 220px;
}

/* ── Vignette ────────────────────────────────────────────────────────────── */
.vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  background: radial-gradient(
    ellipse 80% 80% at 50% 50%,
    transparent 35%,
    rgba(0, 0, 0, 0.55) 80%,
    rgba(0, 0, 0, 0.85) 100%
  );
}

/* ── Bottom fade ─────────────────────────────────────────────────────────── */
.bottom-fade {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 28%;
  pointer-events: none;
  z-index: 4;
  background: linear-gradient(to top, rgba(5, 5, 5, 0.92), transparent);
}

/* ── Hero ────────────────────────────────────────────────────────────────── */
.hero {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3.5rem;
  pointer-events: none;
}

/* ── Side labels ─────────────────────────────────────────────────────────── */
.side-label {
  writing-mode: vertical-rl;
  font-size: 0.55rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.18);
  font-weight: 300;
  white-space: nowrap;
  /* Fade in after the main title */
  animation: label-in 2s ease 1.6s both;
}

.side-label--left  { transform: rotate(180deg); }
.side-label--right { }

@keyframes label-in {
  from { opacity: 0; transform: translateY(8px) rotate(180deg); }
  to   { opacity: 1; transform: translateY(0) rotate(180deg); }
}
.side-label--right {
  animation-name: label-in-r;
}
@keyframes label-in-r {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Title block ─────────────────────────────────────────────────────────── */
.title-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  position: relative;
}

/* Horizontal rules framing the title */
.rule {
  width: 100%;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255, 255, 255, 0.25) 30%,
    rgba(255, 255, 255, 0.25) 70%,
    transparent
  );
  animation: rule-in 1s ease 0.3s both;
}

.rule--top    { margin-bottom: 1.4rem; }
.rule--bottom { margin-top: 1.4rem; }

@keyframes rule-in {
  from { transform: scaleX(0); opacity: 0; }
  to   { transform: scaleX(1); opacity: 1; }
}

/* CJK title */
.title-cjk {
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin: 0;
  line-height: 1;
  /* Custom font stack — falls back gracefully */
  font-family: "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif CJK SC", "SimSun", serif;
  font-weight: 200;
}

/* Each character animates in with a slight upward drift */
.char {
  font-size: clamp(3.5rem, 9vw, 8rem);
  color: rgba(255, 255, 255, 0.92);
  display: inline-block;
  /* Subtle white glow so characters appear lit from within */
  text-shadow:
    0 0 40px rgba(255, 255, 255, 0.20),
    0 0 80px rgba(255, 255, 255, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.6);
  animation: char-in 1s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(0.15s + var(--i) * 0.18s);
  letter-spacing: -0.02em;
}

@keyframes char-in {
  from {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

/* Separator dots between characters */
.char-sep {
  font-size: clamp(1rem, 2.5vw, 2rem);
  color: rgba(255, 255, 255, 0.25);
  font-weight: 100;
  letter-spacing: 0;
  animation: char-in 1s ease 0.6s both;
  line-height: 1;
  /* Align with character midpoint, not baseline */
  align-self: center;
  padding-bottom: 0.1em;
}

/* English subtitle */
.title-sub {
  margin: 0;
  font-size: clamp(0.5rem, 1.2vw, 0.75rem);
  font-weight: 300;
  letter-spacing: 0.65em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
  /* Shift right by half a letter-spacing to visually center the tracked text */
  margin-right: -0.65em;
  animation: sub-in 1.2s ease 0.9s both;
}

@keyframes sub-in {
  from { opacity: 0; letter-spacing: 0.3em; }
  to   { opacity: 1; letter-spacing: 0.65em; }
}

/* Vol index */
.title-index {
  position: absolute;
  bottom: -1.8rem;
  right: 0;
  font-size: 0.5rem;
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.18);
  text-transform: uppercase;
  animation: label-in 1.5s ease 2s both;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .hero {
    gap: 1.5rem;
  }

  .side-label {
    display: none;
  }

  .char {
    font-size: clamp(2.8rem, 12vw, 5rem);
  }

  .title-sub {
    font-size: 0.55rem;
    letter-spacing: 0.4em;
    margin-right: -0.4em;
  }

  .rule--top    { margin-bottom: 1rem; }
  .rule--bottom { margin-top: 1rem; }
}

@media (max-width: 480px) {
  .char {
    font-size: clamp(2.2rem, 14vw, 3.5rem);
  }

  .char-sep {
    font-size: 1rem;
  }

  .title-sub {
    letter-spacing: 0.3em;
    margin-right: -0.3em;
  }
}
</style>