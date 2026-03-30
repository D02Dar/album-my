<script setup>
import { computed, ref } from "vue";
import LightboxModal from "./LightboxModal.vue";

const props = defineProps({
  modelValue: Boolean,
  item: Object,
});

const emit = defineEmits(["update:modelValue"]);

const lightboxOpen = ref(false);
const lightboxSrc = ref("");

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

function closeModal() {
  isOpen.value = false;
}

function openLightbox() {
  if (props.item?.cover_url) {
    lightboxSrc.value = props.item.cover_url;
    lightboxOpen.value = true;
  }
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <!-- Close Button -->
        <button class="modal-close" @click="closeModal" aria-label="Close">✕</button>

        <!-- Two-Column Layout -->
        <div class="modal-inner">
          <!-- Left: Image -->
          <div class="modal-image">
            <button
              v-if="item?.cover_url"
              type="button"
              class="image-button"
              @click="openLightbox"
              :aria-label="`查看 ${item?.title} 大图`"
            >
              <img
                :src="item.cover_url"
                :alt="item?.title"
                class="image"
              />
              <span class="view-overlay">VIEW DETAILS</span>
            </button>
            <div v-else class="no-image">No Image</div>
          </div>

          <!-- Right: Details -->
          <div class="modal-details">
            <h2 class="detail-title">{{ item?.title }}</h2>

            <div v-if="item?.category" class="detail-category">
              <span class="category-tag">{{ item.category.name }}</span>
            </div>

            <div class="detail-meta">
              <div v-if="item?.publish_year" class="detail-row">
                <span class="detail-label">出版年</span>
                <span class="detail-value">{{ item.publish_year }}</span>
              </div>
              <div v-if="item?.publisher" class="detail-row">
                <span class="detail-label">出版社</span>
                <span class="detail-value">{{ item.publisher }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Lightbox for full-screen image view -->
  <LightboxModal v-model="lightboxOpen" :src="lightboxSrc" :alt="item?.title || ''" />
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  padding: 2rem;
}

.modal-content {
  position: relative;
  background: #111;
  border: 1px solid #333;
  width: 100%;
  max-width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10000;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #333;
  color: #666;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 0;
}

.modal-close:hover {
  border-color: #999;
  color: #fff;
}

.modal-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
  gap: 0;
  overflow: hidden;
}

.modal-image {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #222;
  padding: 2rem;
  border-right: 1px solid #333;
}

.image-button {
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: 100%;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: filter 0.3s ease;
}

.image-button:hover .image {
  filter: brightness(0.95);
}

.view-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 0.8rem 1.5rem;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 400;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.image-button:hover .view-overlay {
  opacity: 1;
}

.no-image {
  color: #444;
  font-size: 0.9rem;
}

.modal-details {
  padding: 2.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-title {
  font-size: 1.4rem;
  font-weight: 300;
  color: #ddd;
  line-height: 1.6;
  margin: 0;
}

.detail-category {
  display: flex;
  gap: 0.5rem;
}

.category-tag {
  display: inline-block;
  background: #333;
  color: #999;
  padding: 0.4rem 0.8rem;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid #444;
  border-radius: 0;
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding-top: 1rem;
  border-top: 1px solid #333;
}

.detail-row {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.detail-label {
  color: #555;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  min-width: 60px;
  font-weight: 400;
}

.detail-value {
  color: #999;
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-inner {
    grid-template-columns: 1fr;
  }

  .modal-image {
    border-right: none;
    border-bottom: 1px solid #333;
    min-height: 300px;
  }

  .modal-details {
    padding: 1.5rem;
  }

  .detail-title {
    font-size: 1.1rem;
  }
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
