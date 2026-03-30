<script setup>
import { ref } from "vue";
import { getProxyImageUrl } from "../utils/imageProxy";

defineProps({
  setItem: { type: Object, required: true },
});

const emit = defineEmits(["open-lightbox"]);

const expanded = ref(false);

function onThumbClick(photo, e) {
  e.preventDefault();
  e.stopPropagation();
  emit("open-lightbox", {
    src: getProxyImageUrl(photo.full_url),
    alt: photo.alt || "",
  });
}
</script>

<template>
  <article
    class="set-row"
    @mouseenter="expanded = true"
    @mouseleave="expanded = false"
  >
    <div class="set-row__head">
      <h3 class="set-row__title" :class="{ 'set-row__title--on': expanded }">
        {{ setItem.name }}
      </h3>
    </div>
    <div class="set-row__panel" :class="{ 'set-row__panel--open': expanded }">
      <div class="set-row__inner">
        <div class="set-row__thumbs">
          <button
            v-for="p in setItem.photos"
            :key="p.id"
            type="button"
            class="thumb"
            @click="onThumbClick(p, $event)"
          >
            <img :src="getProxyImageUrl(p.thumb_url)" :alt="p.alt || ''" loading="lazy" />
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.set-row {
  border-bottom: 1px solid #333;
  transition: border-color 0.35s ease;
}

.set-row:hover {
  border-bottom-color: #999;
}

.set-row__head {
  padding: 2rem 0 1.5rem;
}

.set-row__title {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 400;
  letter-spacing: 0.55em;
  text-transform: uppercase;
  color: #666;
  transition: color 0.35s ease;
}

.set-row__title--on {
  color: #ddd;
}

.set-row__panel {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    max-height 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.45s ease;
}

.set-row__panel--open {
  max-height: 480px;
  opacity: 1;
}

.set-row__inner {
  padding-bottom: 2rem;
  padding-top: 0.25rem;
}

.set-row__thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  align-items: center;
}

.thumb {
  border: 1px solid #333;
  padding: 0;
  margin: 0;
  background: #1a1a1a;
  cursor: pointer;
  overflow: hidden;
  height: 168px;
  transition: border-color 0.25s ease;
}

.thumb:hover {
  border-color: #999;
}

.thumb img {
  display: block;
  height: 168px;
  width: auto;
  max-width: 280px;
  object-fit: cover;
}
</style>
