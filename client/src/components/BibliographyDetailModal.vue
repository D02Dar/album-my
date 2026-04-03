<script setup>
import { computed, ref } from "vue";
import { useAuthStore } from "../stores/auth";
import LightboxModal from "./LightboxModal.vue";
import api from "../api";

const props = defineProps({
  modelValue: Boolean,
  item: Object,
});

const emit = defineEmits(["update:modelValue"]);
const auth = useAuthStore();
const isAuthenticated = computed(() => auth.isAuthenticated);

const lightboxOpen = ref(false);
const lightboxSrc = ref("");
const isTransforming = ref(false);
const transformError = ref("");

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

async function transformImage(action) {
  if (!props.item?.id || isTransforming.value) return;
  isTransforming.value = true;
  transformError.value = "";
  try {
    const { data } = await api.patch(`/api/bibliography/${props.item.id}/transform-image`, { action });
    // Update the item's cover_url reactively — add a cache-bust param so browser reloads
    props.item.cover_url = data.cover_url + "?t=" + Date.now();
  } catch (e) {
    transformError.value = e.response?.data?.error ?? e.message ?? "操作失败";
  } finally {
    isTransforming.value = false;
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
              <span class="view-overlay">DETAILS</span>
            </button>
            <div v-else class="no-image">No Image</div>

            <!-- Transform Controls (admin only) -->
            <div v-if="isAuthenticated && item?.cover_url" class="transform-controls">
              <button
                type="button"
                class="btn-transform"
                :disabled="isTransforming"
                @click="transformImage('rotate-left')"
                title="向左旋转90°"
              >
                ↺ 左转
              </button>
              <button
                type="button"
                class="btn-transform"
                :disabled="isTransforming"
                @click="transformImage('rotate-right')"
                title="向右旋转90°"
              >
                ↻ 右转
              </button>
              <button
                type="button"
                class="btn-transform"
                :disabled="isTransforming"
                @click="transformImage('flip')"
                title="水平镜像翻转"
              >
                ⇋ 镜像
              </button>
              <span v-if="isTransforming" class="transform-status">处理中…</span>
              <span v-if="transformError" class="transform-error">{{ transformError }}</span>
            </div>
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #222;
  padding: 2rem;
  border-right: 1px solid #333;
  gap: 1rem;
}

.image-button {
  position: relative;
  width: 100%;
  max-width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.image {
  max-width: 100%;
  max-height: 340px;
  object-fit: contain;
  transition: filter 0.3s ease;
  display: block;
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

/* Transform Controls */
.transform-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  padding-top: 0.5rem;
  border-top: 1px solid #2a2a2a;
  width: 100%;
}

.btn-transform {
  padding: 0.45rem 0.9rem;
  background: transparent;
  color: #666;
  border: 1px solid #333;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: inherit;
  font-weight: 400;
}

.btn-transform:hover:not(:disabled) {
  color: #fff;
  border-color: #999;
}

.btn-transform:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.transform-status {
  font-size: 0.68rem;
  color: #666;
  letter-spacing: 0.05em;
}

.transform-error {
  font-size: 0.68rem;
  color: #ff6b6b;
  letter-spacing: 0.05em;
}

/* Right panel */
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

@media (max-width: 768px) {
  .modal-inner {
    grid-template-columns: 1fr;
  }
  .modal-image {
    border-right: none;
    border-bottom: 1px solid #333;
    min-height: 280px;
  }
  .modal-details {
    padding: 1.5rem;
  }
  .detail-title {
    font-size: 1.1rem;
  }
}

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