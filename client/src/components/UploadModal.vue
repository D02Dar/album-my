<script setup>
import { ref, watch } from "vue";
import { useGalleryStore } from "../stores/gallery";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] },
  selectedCategory: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "update:selected-category", "create-category", "uploaded"]);

const gallery = useGalleryStore();
const title = ref("");
const file = ref(null);
const fileInput = ref(null);
const localError = ref("");
const busy = ref(false);
const showNewCategory = ref(false);
const newCategoryName = ref("");
const creatingCategory = ref(false);

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      localError.value = "";
      title.value = "";
      file.value = null;
      showNewCategory.value = false;
      newCategoryName.value = "";
      if (fileInput.value) fileInput.value.value = "";
    }
  }
);

function close() {
  emit("update:modelValue", false);
}

function onFileChange(e) {
  const f = e.target.files?.[0];
  file.value = f ?? null;
}

async function createNewCategory() {
  if (!newCategoryName.value.trim()) return;
  
  creatingCategory.value = true;
  try {
    const cat = await gallery.createCategory(newCategoryName.value);
    emit("update:selected-category", cat.id);
    newCategoryName.value = "";
    showNewCategory.value = false;
  } catch (e) {
    localError.value = e.response?.data?.error ?? e.message ?? "创建失败";
  } finally {
    creatingCategory.value = false;
  }
}

async function submit() {
  localError.value = "";
  if (!file.value) {
    localError.value = "请选择图片";
    return;
  }
  busy.value = true;
  try {
    await gallery.uploadPhoto(file.value, title.value, props.selectedCategory);
    emit("uploaded");
    close();
  } catch (e) {
    localError.value = e.response?.data?.error ?? e.message ?? "上传失败";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="upload-modal" role="dialog" aria-modal="true">
        <button type="button" class="upload-modal__close" aria-label="关闭" @click="close">
          ×
        </button>
        <div class="upload-modal__panel">
          <h2 class="upload-modal__heading">上传</h2>
          <p class="upload-modal__hint">JPEG / PNG</p>

          <label class="upload-modal__label">标题（可选）</label>
          <input v-model="title" type="text" autocomplete="off" />

          <label class="upload-modal__label">分类（可选）</label>
          <select 
            :value="selectedCategory"
            class="upload-modal__select" 
            @change="$emit('update:selected-category', $event.target.value)"
          >
            <option value="">-- 选择分类 --</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>

          <button
            type="button"
            class="upload-modal__toggle-new"
            @click="showNewCategory = !showNewCategory"
          >
            {{ showNewCategory ? "取消创建" : "或创建新分类" }}
          </button>

          <div v-if="showNewCategory" class="upload-modal__new-category">
            <input
              v-model="newCategoryName"
              type="text"
              placeholder="分类名称"
              class="upload-modal__new-input"
              @keyup.enter="createNewCategory"
            />
            <button
              type="button"
              class="upload-modal__create-btn"
              :disabled="!newCategoryName.trim() || creatingCategory"
              @click="createNewCategory"
            >
              {{ creatingCategory ? "创建中..." : "创建" }}
            </button>
          </div>

          <label class="upload-modal__label">图片</label>
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg, image/png, image/webp, image/heic, image/gif"
            class="upload-modal__file"
            @change="onFileChange"
          />

          <p v-if="localError" class="upload-modal__error">{{ localError }}</p>

          <div class="upload-modal__actions">
            <button type="button" @click="close">取消</button>
            <button type="button" :disabled="busy" @click="submit">
              {{ busy ? "上传中…" : "提交" }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.upload-modal {
  position: fixed;
  inset: 0;
  z-index: 9990;
  background: #111111;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.upload-modal__close {
  position: fixed;
  top: 1.75rem;
  right: 2rem;
  border: none;
  background: none;
  font-size: 2rem;
  font-weight: 200;
  line-height: 1;
  padding: 0.25rem 0.5rem;
  letter-spacing: 0;
  text-transform: none;
  color: #eeeeee;
}

.upload-modal__close:hover {
  opacity: 0.7;
  background: none;
  color: #ffffff;
}

.upload-modal__panel {
  width: 100%;
  max-width: 360px;
  border: 1px solid rgba(238, 238, 238, 0.2);
  padding: 2.5rem 2rem;
  background: #141414;
}

.upload-modal__heading {
  margin: 0 0 0.5rem;
  font-size: 0.72rem;
  font-weight: 400;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: #eeeeee;
}

.upload-modal__hint {
  margin: 0 0 2rem;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  color: #666666;
  line-height: 1.5;
}

.upload-modal__label {
  display: block;
  font-size: 0.6rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  margin: 1.25rem 0 0.5rem;
  color: #999999;
}

.upload-modal__label:first-of-type {
  margin-top: 0;
}

.upload-modal__select,
.upload-modal__new-input,
input[type="text"],
.upload-modal__file {
  width: 100%;
  padding: 0.7rem;
  background: #111111;
  border: 1px solid rgba(238, 238, 238, 0.2);
  color: #ddd;
  font-size: 0.8rem;
  font-family: inherit;
  box-sizing: border-box;
}

.upload-modal__select option {
  background: #1a1a1a;
  color: #ddd;
}

.upload-modal__toggle-new {
  display: block;
  margin: 1rem 0 0;
  padding: 0;
  background: none;
  border: none;
  color: #666;
  font-size: 0.7rem;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s;
}

.upload-modal__toggle-new:hover {
  color: #999;
}

.upload-modal__new-category {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.upload-modal__new-input {
  flex: 1;
}

.upload-modal__create-btn {
  padding: 0.7rem 1rem;
  background: transparent;
  border: 1px solid rgba(238, 238, 238, 0.2);
  color: #666;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  font-weight: 400;
}

.upload-modal__create-btn:hover:not(:disabled) {
  color: #fff;
  border-color: #999;
}

.upload-modal__create-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.upload-modal__file {
  border: 1px dashed rgba(238, 238, 238, 0.25);
  padding: 0.75rem;
  font-size: 0.8rem;
  color: #999999;
  background: #111111;
}

.upload-modal__error {
  margin: 1rem 0 0;
  font-size: 0.8rem;
  color: #cccccc;
}

.upload-modal__actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: flex-end;
}

.upload-modal__actions button {
  padding: 0.6rem 1rem;
  background: transparent;
  border: 1px solid rgba(238, 238, 238, 0.2);
  color: #666;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  font-weight: 400;
}

.upload-modal__actions button:hover:not(:disabled) {
  color: #fff;
  border-color: #999;
}

.upload-modal__actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
