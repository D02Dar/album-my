<script setup>
import { ref, onMounted } from "vue";
import { useGalleryStore } from "../stores/gallery";
import GallerySetRow from "./GallerySetRow.vue";
import LightboxModal from "./LightboxModal.vue";

const gallery = useGalleryStore();

const lightboxOpen = ref(false);
const lightboxSrc = ref("");
const lightboxAlt = ref("");

onMounted(() => {
  gallery.fetchPhotos();
});

function onOpenLightbox({ src, alt }) {
  lightboxSrc.value = src;
  lightboxAlt.value = alt || "";
  lightboxOpen.value = true;
}
</script>

<template>
  <section class="accordion">
    <p v-if="gallery.loadError" class="accordion__err">{{ gallery.loadError }}</p>
    <p v-else-if="!gallery.photos.length" class="accordion__empty">暂无照片 · 登录后可在上传页添加</p>
    <div v-else class="accordion__list">
      <GallerySetRow
        v-for="s in gallery.accordionSets"
        :key="s.id"
        :set-item="s"
        @open-lightbox="onOpenLightbox"
      />
    </div>
    <LightboxModal v-model="lightboxOpen" :src="lightboxSrc" :alt="lightboxAlt" />
  </section>
</template>

<style scoped>
.accordion {
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 3vw 5rem;
}

.accordion__err {
  margin: 0;
  font-size: 0.85rem;
  color: #cccccc;
}

.accordion__empty {
  margin: 0;
  padding: 4rem 0;
  font-size: 0.72rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #666666;
  text-align: center;
}

.accordion__list {
  display: flex;
  flex-direction: column;
}
</style>
