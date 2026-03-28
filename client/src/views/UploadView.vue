<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";
import UploadModal from "../components/UploadModal.vue";

const modalOpen = ref(false);

function openModal() {
  modalOpen.value = true;
}
</script>

<template>
  <div class="upload-page">
    <header class="upload-page__header">
      <RouterLink to="/" class="upload-page__home">PHOTOGALLERY</RouterLink>
      <button type="button" class="upload-page__open" @click="openModal">上传图片</button>
    </header>
    <p class="upload-page__note">照片将写入 Supabase 的 photos 表，并在首页展示。</p>
    <UploadModal v-model="modalOpen" />
  </div>
</template>

<style scoped>
.upload-page {
  min-height: 100vh;
  padding: 3rem 3vw;
  background: #111111;
}

.upload-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  border-bottom: 1px solid rgba(238, 238, 238, 0.12);
  padding-bottom: 2rem;
  max-width: 960px;
}

.upload-page__home {
  font-size: 0.68rem;
  letter-spacing: 0.55em;
  text-transform: uppercase;
  border: none;
  color: #999999;
}

.upload-page__home:hover {
  color: #eeeeee;
}

.upload-page__open {
  flex-shrink: 0;
}

.upload-page__note {
  max-width: 520px;
  margin: 3rem 0 0;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  line-height: 1.7;
  color: #666666;
}
</style>
