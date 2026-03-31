<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "../stores/auth";
import { useGalleryStore } from "../stores/gallery";
import { getProxyImageUrl } from "../utils/imageProxy";
import GalleryAccordion from "../components/GalleryAccordion.vue";
import UploadModal from "../components/UploadModal.vue";

const auth = useAuthStore();
const gallery = useGalleryStore();
const modalOpen = ref(false);
const selectedCategory = ref("");
const newCategoryName = ref("");
const creatingCategory = ref(false);
const showAdmin = ref(false);
const deletingPhotoId = ref(null);

// 管理面板相关
const adminFilterCategory = ref(null); // null = 全部
const showNewCategoryInput = ref(false);
const adminNewCategoryName = ref("");
const creatingAdminCategory = ref(false);

// 拖动排序相关
const draggedPhotoId = ref(null);
const draggedOverPhotoId = ref(null);

// 快速排序相关
const sortingPhotoId = ref(null);

onMounted(() => {
  gallery.fetchPhotos();
  gallery.fetchCategories();
});

function openModal() {
  selectedCategory.value = "";
  newCategoryName.value = "";
  modalOpen.value = true;
}

async function createNewCategory() {
  if (!newCategoryName.value.trim()) return;
  
  creatingCategory.value = true;
  try {
    const cat = await gallery.createCategory(newCategoryName.value);
    selectedCategory.value = cat.id;
    newCategoryName.value = "";
  } catch (e) {
    console.error("Failed to create category:", e);
  } finally {
    creatingCategory.value = false;
  }
}

async function createAdminNewCategory() {
  if (!adminNewCategoryName.value.trim()) return;
  
  creatingAdminCategory.value = true;
  try {
    const cat = await gallery.createCategory(adminNewCategoryName.value);
    adminNewCategoryName.value = "";
    showNewCategoryInput.value = false;
  } catch (e) {
    console.error("Failed to create category:", e);
  } finally {
    creatingAdminCategory.value = false;
  }
}

// 管理面板过滤后的照片列表
const filteredPhotos = computed(() => {
  if (!adminFilterCategory.value) {
    return gallery.photos;
  }
  return gallery.photos.filter(p => p.category_id === adminFilterCategory.value);
});

async function deletePhoto(photoId) {
  if (!confirm("确定要删除这张照片吗？")) return;
  
  deletingPhotoId.value = photoId;
  try {
    await gallery.deletePhoto(photoId);
    deletingPhotoId.value = null;
  } catch (e) {
    console.error("Failed to delete photo:", e);
    deletingPhotoId.value = null;
  }
}

// 拖动排序逻辑
function onDragStart(photoId) {
  draggedPhotoId.value = photoId;
}

function onDragOver(e, photoId) {
  e.preventDefault();
  draggedOverPhotoId.value = photoId;
}

function onDragLeave() {
  draggedOverPhotoId.value = null;
}

async function onDrop(e, targetPhotoId) {
  e.preventDefault();
  draggedOverPhotoId.value = null;
  
  if (draggedPhotoId.value === targetPhotoId) {
    draggedPhotoId.value = null;
    return;
  }

  const sourcePhoto = gallery.photos.find(p => p.id === draggedPhotoId.value);
  const targetPhoto = gallery.photos.find(p => p.id === targetPhotoId);

  if (!sourcePhoto || !targetPhoto) return;

  // 基于所有照片列表来计算排序（不是过滤列表）
  const allPhotos = [...gallery.photos];
  const sourceIndex = allPhotos.findIndex(p => p.id === draggedPhotoId.value);
  const targetIndex = allPhotos.findIndex(p => p.id === targetPhotoId);

  if (sourceIndex === -1 || targetIndex === -1) return;

  // 交换位置
  [allPhotos[sourceIndex], allPhotos[targetIndex]] = [allPhotos[targetIndex], allPhotos[sourceIndex]];

  // 生成新的 display_order（基于所有照片的新顺序）
  const orders = allPhotos.map((photo, index) => ({
    id: photo.id,
    display_order: allPhotos.length - index
  }));

  try {
    await gallery.updatePhotoOrder(orders);
    // 重新加载照片列表以确保顺序正确
    await gallery.fetchPhotos();
  } catch (e) {
    console.error("Failed to update photo order:", e);
    alert("更新排序失败，请重试");
  }

  draggedPhotoId.value = null;
}

// 快速排序功能（移到顶部/底部）
async function movePhotoToTop(photoId) {
  try {
    sortingPhotoId.value = photoId;
    const allPhotos = [...gallery.photos];
    const currentIndex = allPhotos.findIndex(p => p.id === photoId);
    
    if (currentIndex <= 0) return; // 已在顶部
    
    // 将照片移到顶部
    const [photo] = allPhotos.splice(currentIndex, 1);
    allPhotos.unshift(photo);
    
    // 生成新的 display_order
    const orders = allPhotos.map((p, index) => ({
      id: p.id,
      display_order: allPhotos.length - index
    }));
    
    await gallery.updatePhotoOrder(orders);
    await gallery.fetchPhotos();
  } catch (e) {
    console.error("Failed to move photo to top:", e);
    alert("操作失败，请重试");
  } finally {
    sortingPhotoId.value = null;
  }
}

async function movePhotoToBottom(photoId) {
  try {
    sortingPhotoId.value = photoId;
    const allPhotos = [...gallery.photos];
    const currentIndex = allPhotos.findIndex(p => p.id === photoId);
    
    if (currentIndex >= allPhotos.length - 1) return; // 已在底部
    
    // 将照片移到底部
    const [photo] = allPhotos.splice(currentIndex, 1);
    allPhotos.push(photo);
    
    // 生成新的 display_order
    const orders = allPhotos.map((p, index) => ({
      id: p.id,
      display_order: allPhotos.length - index
    }));
    
    await gallery.updatePhotoOrder(orders);
    await gallery.fetchPhotos();
  } catch (e) {
    console.error("Failed to move photo to bottom:", e);
    alert("操作失败，请重试");
  } finally {
    sortingPhotoId.value = null;
  }
}

function onUploaded() {
  gallery.fetchPhotos();
  selectedCategory.value = "";
  newCategoryName.value = "";
  modalOpen.value = false;
}
</script>

<template>
  <div class="gallery-view">
    <!-- 上传按钮区域（仅登陆用户可见） -->
    <div v-if="auth.isAuthenticated" class="gallery-view__controls">
      <button type="button" class="btn-upload" @click="openModal">
        上传图片
      </button>
      <button type="button" class="btn-admin" @click="showAdmin = !showAdmin">
        {{ showAdmin ? "关闭管理" : "管理" }}
      </button>
    </div>

    <!-- 管理面板（仅登陆用户可见） -->
    <div v-if="auth.isAuthenticated && showAdmin" class="admin-panel">
      <h2 class="admin-panel__title">管理</h2>
      
      <!-- 分类管理 -->
      <div class="admin-section">
        <div class="section-header">
          <h3 class="admin-section__title">分类</h3>
          <button 
            v-if="!showNewCategoryInput"
            type="button" 
            class="btn-add-category"
            @click="showNewCategoryInput = true"
          >
            + 添加
          </button>
        </div>

        <!-- 新建分类输入 -->
        <div v-if="showNewCategoryInput" class="new-category-input">
          <input
            v-model="adminNewCategoryName"
            type="text"
            placeholder="输入新分类名称"
            class="category-input"
            @keyup.enter="createAdminNewCategory"
            @keyup.esc="showNewCategoryInput = false"
          />
          <button 
            type="button"
            class="btn-create"
            :disabled="creatingAdminCategory || !adminNewCategoryName.trim()"
            @click="createAdminNewCategory"
          >
            {{ creatingAdminCategory ? "创建中..." : "创建" }}
          </button>
          <button 
            type="button"
            class="btn-cancel"
            @click="showNewCategoryInput = false"
          >
            取消
          </button>
        </div>

        <!-- 分类列表 -->
        <div v-if="gallery.categories.length === 0" class="admin-empty">
          暂无分类
        </div>
        <div v-else class="categories-list">
          <div
            v-for="cat in gallery.categories"
            :key="cat.id"
            class="category-tag"
            :class="{ active: adminFilterCategory === cat.id }"
            @click="adminFilterCategory = adminFilterCategory === cat.id ? null : cat.id"
          >
            {{ cat.name }}
          </div>
        </div>
      </div>

      <!-- 照片拖动排序 -->
      <div class="admin-section">
        <h3 class="admin-section__title">照片排序（拖动更改顺序）</h3>
        <div v-if="filteredPhotos.length === 0" class="admin-empty">
          {{ adminFilterCategory ? "该分类无照片" : "暂无照片" }}
        </div>
        <div v-else class="photos-drag-list">
          <div
            v-for="photo in filteredPhotos"
            :key="photo.id"
            class="photo-drag-item"
            :class="{ 
              dragging: draggedPhotoId === photo.id,
              dragover: draggedOverPhotoId === photo.id
            }"
            draggable="true"
            @dragstart="onDragStart(photo.id)"
            @dragover="onDragOver($event, photo.id)"
            @dragleave="onDragLeave"
            @drop="onDrop($event, photo.id)"
          >
            <div class="drag-handle">≡</div>
            <img :src="getProxyImageUrl(photo.url)" :alt="photo.title" class="photo-thumb" />
            <div class="photo-info">
              <div class="photo-title">{{ photo.title || "无标题" }}</div>
              <div class="photo-category">
                {{ photo.gallery_categories?.name || "未分类" }}
              </div>
            </div>
            <!-- 快速排序按钮 -->
            <div class="photo-actions">
              <button
                type="button"
                class="btn-sort"
                title="移至顶部"
                :disabled="sortingPhotoId === photo.id || gallery.photos[0]?.id === photo.id"
                @click="movePhotoToTop(photo.id)"
              >
                ⬆️
              </button>
              <button
                type="button"
                class="btn-sort"
                title="移至底部"
                :disabled="sortingPhotoId === photo.id || gallery.photos[gallery.photos.length - 1]?.id === photo.id"
                @click="movePhotoToBottom(photo.id)"
              >
                ⬇️
              </button>
              <button
                type="button"
                class="btn-delete"
                :disabled="deletingPhotoId === photo.id"
                @click="deletePhoto(photo.id)"
              >
                {{ deletingPhotoId === photo.id ? "删除中..." : "删除" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相册内容 -->
    <GalleryAccordion />

    <!-- 上传模态框 -->
    <UploadModal 
      v-model="modalOpen"
      :categories="gallery.categories"
      :selected-category="selectedCategory"
      @update:selected-category="selectedCategory = $event"
      @create-category="createNewCategory"
      @uploaded="onUploaded"
    />
  </div>
</template>

<style scoped>
.gallery-view {
  background: #111111;
  min-height: 100vh;
}

.gallery-view__controls {
  padding: 2rem 5%;
  border-bottom: 1px solid #333;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-upload,
.btn-admin {
  background: transparent;
  color: #666;
  border: 1px solid #333;
  padding: 0.7rem 1.5rem;
  cursor: pointer;
  border-radius: 0;
  font-size: 0.75rem;
  transition: all 0.2s;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: 400;
}

.btn-upload:hover,
.btn-admin:hover {
  color: #fff;
  border-color: #999;
}

.btn-upload:disabled,
.btn-admin:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Admin Panel */
.admin-panel {
  background: #1a1a1a;
  border-bottom: 1px solid #333;
  padding: 3rem 5%;
  margin-bottom: 2rem;
}

.admin-panel__title {
  font-size: 0.68rem;
  font-weight: 400;
  letter-spacing: 0.55em;
  text-transform: uppercase;
  color: #666;
  margin: 0 0 2rem 0;
}

.admin-section {
  margin-bottom: 3rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.admin-section__title {
  font-size: 0.6rem;
  font-weight: 400;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #555;
  margin: 0;
}

.btn-add-category {
  background: transparent;
  color: #666;
  border: 1px solid #333;
  padding: 0.4rem 0.8rem;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-category:hover {
  color: #fff;
  border-color: #999;
}

.admin-empty {
  font-size: 0.85rem;
  color: #555;
  padding: 1rem 0;
}

/* 新建分类 */
.new-category-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #222;
  border: 1px solid #333;
}

.category-input {
  flex: 1;
  background: #111;
  border: 1px solid #333;
  color: #ddd;
  padding: 0.6rem;
  font-size: 0.85rem;
  font-family: inherit;
}

.category-input:focus {
  outline: none;
  border-color: #666;
}

.btn-create,
.btn-cancel {
  background: transparent;
  color: #666;
  border: 1px solid #333;
  padding: 0.5rem 1rem;
  font-size: 0.7rem;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.2s;
}

.btn-create:hover:not(:disabled),
.btn-cancel:hover {
  color: #fff;
  border-color: #999;
}

.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 分类标签 */
.categories-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.category-tag {
  background: #222;
  color: #999;
  padding: 0.6rem 1.2rem;
  font-size: 0.75rem;
  border: 1px solid #333;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  user-select: none;
}

.category-tag:hover {
  color: #ddd;
  border-color: #666;
}

.category-tag.active {
  color: #fff;
  border-color: #999;
  background: #333;
}

/* 拖动排序列表 */
.photos-drag-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.photo-drag-item {
  display: grid;
  grid-template-columns: 50px 80px 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: #222;
  border: 1px solid #333;
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
}

.photo-drag-item:active {
  cursor: grabbing;
}

.photo-drag-item.dragging {
  opacity: 0.5;
  background: #1a1a1a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.photo-drag-item.dragover {
  background: #2a2a2a;
  border: 2px solid #666;
  padding: 0.95rem;
  box-shadow: inset 0 0 8px rgba(102, 179, 255, 0.2);
}

.drag-handle {
  text-align: center;
  color: #666;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: grab;
  user-select: none;
  padding: 0.75rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.drag-handle:hover {
  color: #999;
  background: rgba(255, 255, 255, 0.05);
}

.drag-handle:active {
  cursor: grabbing;
  color: #ddd;
  background: rgba(255, 255, 255, 0.1);
}

.photo-thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  background: #111;
  border: 1px solid #333;
}

.photo-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.photo-title {
  font-size: 0.85rem;
  color: #ddd;
  font-weight: 400;
}

.photo-category {
  font-size: 0.7rem;
  color: #666;
  text-transform: uppercase;
}

/* 照片操作按钮组 */
.photo-actions {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.btn-sort {
  padding: 0.4rem 0.5rem;
  background: transparent;
  color: #666;
  border: 1px solid #333;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 2rem;
}

.btn-sort:hover:not(:disabled) {
  color: #66b3ff;
  border-color: #66b3ff;
  background: rgba(102, 179, 255, 0.1);
}

.btn-sort:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-delete {
  padding: 0.5rem 0.8rem;
  background: transparent;
  color: #666;
  border: 1px solid #333;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  font-weight: 400;
  white-space: nowrap;
}

.btn-delete:hover:not(:disabled) {
  color: #ff6b6b;
  border-color: #ff6b6b;
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
