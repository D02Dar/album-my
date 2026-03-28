<script setup>
import { watch, onMounted, onUnmounted } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  src: { type: String, default: "" },
  alt: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue"]);

function close() {
  emit("update:modelValue", false);
}

function onKeydown(e) {
  if (e.key === "Escape") close();
}

watch(
  () => props.modelValue,
  (open) => {
    document.body.style.overflow = open ? "hidden" : "";
  }
);

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue && src"
        class="lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="图片预览"
        @click.self="close"
      >
        <button type="button" class="lightbox__close" aria-label="关闭" @click="close">
          ×
        </button>
        <img class="lightbox__img" :src="src" :alt="alt" />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.lightbox__close {
  position: fixed;
  top: 1.25rem;
  right: 1.5rem;
  z-index: 10001;
  border: none;
  background: none;
  color: #eeeeee;
  font-size: 2.25rem;
  font-weight: 200;
  line-height: 1;
  padding: 0.35rem 0.65rem;
  letter-spacing: 0;
  text-transform: none;
  opacity: 0.85;
}

.lightbox__close:hover {
  opacity: 1;
  color: #ffffff;
  background: none;
}

.lightbox__img {
  max-width: 90vw;
  max-height: 90vh;
  width: auto;
  height: auto;
  object-fit: contain;
}
</style>
