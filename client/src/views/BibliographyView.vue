<template>
  <div class="bibliography-container">

    <!-- ── Cinematic transition overlay ─────────────────────────────────── -->
    <div
      class="memory-transition-overlay"
      :class="{ 'is-transitioning': isTransitioning }"
    ></div>

    <!-- 管理按钮 -->
    <div v-if="isAuthenticated" class="admin-controls">
      <button type="button" class="btn-admin" @click="showAdmin = !showAdmin">
        {{ showAdmin ? "关闭管理" : "管理" }}
      </button>
    </div>

    <!-- 拖动排序管理面板 -->
    <div v-if="isAuthenticated && showAdmin" class="admin-manage-panel">
      <h2 class="admin-panel__title">书籍管理</h2>
      
      <!-- 分类过滤 -->
      <div class="admin-section">
        <div class="section-header">
          <h3 class="admin-section__title">分类过滤</h3>
        </div>
        <div v-if="categories.length === 0" class="admin-empty">
          暂无分类
        </div>
        <div v-else class="categories-list">
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="category-tag"
            :class="{ active: adminFilterCategory === cat.id }"
            @click="adminFilterCategory = adminFilterCategory === cat.id ? null : cat.id"
          >
            {{ cat.name }}
          </div>
        </div>
      </div>

      <!-- 拖动排序 -->
      <div class="admin-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 class="admin-section__title">书籍排序</h3>
          <button
            v-if="filteredBibliographies.length > 0"
            type="button"
            class="btn-toggle-order-mode"
            @click="isMobileOrderMode = !isMobileOrderMode"
          >
            {{ isMobileOrderMode ? "拖拽排序" : "精确排序" }}
          </button>
        </div>

        <div v-if="filteredBibliographies.length === 0" class="admin-empty">
          {{ adminFilterCategory ? "该分类无书籍" : "暂无书籍" }}
        </div>

        <!-- 拖拽排序模式（桌面） -->
        <div v-else-if="!isMobileOrderMode" class="books-drag-list">
          <div
            v-for="book in filteredBibliographies"
            :key="book.id"
            class="book-drag-item"
            :class="{ 
              dragging: draggedBookId === book.id,
              dragover: draggedOverBookId === book.id
            }"
            draggable="true"
            @dragstart="onDragStart(book.id)"
            @dragover="onDragOver($event, book.id)"
            @dragleave="onDragLeave"
            @drop="onDrop($event, book.id)"
          >
            <div class="drag-handle">≡</div>
            <img v-if="book.cover_url" :src="book.cover_url" :alt="book.title" class="book-thumb" />
            <div v-else class="book-thumb book-placeholder">No Image</div>
            <div class="book-info">
              <div class="book-title">{{ book.title }}</div>
              <div v-if="book.category" class="book-category">
                {{ book.category.name }}
              </div>
              <div v-if="book.publish_year" class="book-year">
                {{ book.publish_year }}
              </div>
            </div>
            <!-- 快速排序按钮 -->
            <div class="book-actions">
              <button
                type="button"
                class="btn-sort"
                title="移至顶部"
                :disabled="sortingBookId === book.id || bibliographies[0]?.id === book.id"
                @click="moveBookToTop(book.id)"
              >
                ⬆️
              </button>
              <button
                type="button"
                class="btn-sort"
                title="移至底部"
                :disabled="sortingBookId === book.id || bibliographies[bibliographies.length - 1]?.id === book.id"
                @click="moveBookToBottom(book.id)"
              >
                ⬇️
              </button>
              <button
                type="button"
                class="btn-delete"
                :disabled="isDeletingId === book.id"
                @click="deleteBibliography(book.id)"
              >
                {{ isDeletingId === book.id ? "删除中..." : "删除" }}
              </button>
            </div>
          </div>
        </div>

        <!-- 精确排序模式（移动端友好） -->
        <div v-else class="mobile-order-section">
          <div class="mobile-order-list">
            <div
              v-for="(book, index) in filteredBibliographies"
              :key="book.id"
              class="mobile-order-item"
            >
              <div class="order-position">
                <span class="position-label">{{ index + 1 }}/{{ filteredBibliographies.length }}</span>
              </div>
              <div class="order-book-info">
                <span class="order-title">{{ book.title }}</span>
              </div>
              <div class="order-buttons">
                <button
                  type="button"
                  class="btn-order-arrow"
                  :disabled="sortingBookId === book.id"
                  @click="jumpToPosition(index)"
                  title="跳转位置"
                >
                  ⇋ 跳转
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="btn-save-order"
            @click="saveCustomOrder"
            :disabled="sortingBookId !== null"
          >
            {{ sortingBookId ? "保存中..." : "保存排序" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Admin Panel -->
    <div v-if="isAuthenticated && !showAdmin" class="admin-panel">
      <h2>Add Bibliography</h2>
      <form @submit.prevent="addBibliography" class="admin-form">
        <div class="form-group">
          <label for="title">Title *</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            placeholder="e.g., Design Patterns"
            required
          />
        </div>

        <div class="form-group">
          <label for="publish_year">Publish Year</label>
          <input
            id="publish_year"
            v-model="formData.publish_year"
            type="text"
            placeholder="e.g., 2007/6"
          />
        </div>

        <div class="form-group">
          <label for="publisher">Publisher</label>
          <input
            id="publisher"
            v-model="formData.publisher"
            type="text"
            placeholder="e.g., Rm Verlag, S.L."
          />
        </div>

        <div class="form-group">
          <label for="category">Category</label>
          <select
            id="category"
            v-model="formData.category_id"
            class="category-select"
          >
            <option value="">-- Select Category --</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
          <div class="new-category-row">
            <input
              v-model="newCategoryName"
              type="text"
              placeholder="Or create new category..."
              class="new-category-input"
              @keyup.enter="createNewCategory"
            />
            <button
              type="button"
              class="btn-create-category"
              @click="createNewCategory"
              :disabled="!newCategoryName.trim()"
            >
              Create
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="cover">Cover Image (JPEG, PNG, WEBP, HEIC, TIFF)</label>
          <input
            id="cover"
            ref="coverInput"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/tiff"
            @change="onCoverSelect"
          />
          <span v-if="selectedFileName" class="file-name">{{ selectedFileName }}</span>
        </div>

        <button type="submit" class="btn-submit" :disabled="isSubmitting">
          {{ isSubmitting ? "Adding..." : "Add Record" }}
        </button>
        <p v-if="submitMessage" :class="['submit-message', submitMessageType]">
          {{ submitMessage }}
        </p>
      </form>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <p>Loading bibliography...</p>
    </div>

    <!-- Bibliography Grid -->
    <div v-show="!isLoading" class="biblio-grid" ref="gridContainer">
      <div
        v-for="item in bibliographies"
        :key="item.id"
        class="biblio-cell"
      >
        <!-- Book Cover with "VIEW DETAILS" Overlay -->
        <div class="cover-container">
          <button
            class="book-cover"
            @click="openDetails(item)"
            :aria-label="`View details for ${item.title}`"
          >
            <img
              v-if="item.cover_url"
              :src="item.cover_url"
              :alt="item.title"
              class="cover-image"
              @error="onImageError"
            />
            <div v-else class="cover-placeholder">No Image</div>
            <span class="view-details-overlay">VIEW DETAILS</span>
          </button>
        </div>

        <!-- Title -->
        <h3 class="cell-title">{{ item.title }}</h3>

        <!-- Meta Info -->
        <div class="cell-meta">
          <div class="meta-row" v-if="item.publish_year">
            <span class="meta-label">出版年</span>
            <span class="meta-value">{{ item.publish_year }}</span>
          </div>
          <div class="meta-row" v-if="item.publisher">
            <span class="meta-label">出版社</span>
            <span class="meta-value">{{ item.publisher }}</span>
          </div>
          <div v-if="item.category" class="category-display">
            <span class="category-tag">{{ item.category.name }}</span>
          </div>
        </div>

        <!-- Delete Button (Admin Only) -->
        <button
          v-if="isAuthenticated"
          @click="deleteBibliography(item.id)"
          class="btn-delete"
          :disabled="isDeletingId === item.id"
        >
          {{ isDeletingId === item.id ? "Deleting..." : "Delete" }}
        </button>
      </div>

      <!-- ── Return to Origin cell ────────────────────────────────────────── -->
      <div
        v-if="bibliographies.length > 0"
        class="biblio-cell return-cell"
        @click="triggerMemoryReturn"
        role="button"
        tabindex="0"
        @keyup.enter="triggerMemoryReturn"
        aria-label="Return to origin"
      >
        <div class="return-content">
          <span class="return-text">R E T U R N<br>T O<br>O R I G I N</span>
        </div>
      </div>
      <!-- ─────────────────────────────────────────────────────────────────── -->

    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && bibliographies.length === 0" class="empty-state">
      <p>No bibliography records yet.</p>
    </div>

    <!-- Detail Modal -->
    <BibliographyDetailModal v-model="detailModalOpen" :item="selectedItem" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import BibliographyDetailModal from "../components/BibliographyDetailModal.vue";
import api from "../api";

const router = useRouter();
const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);

// ── Cinematic return transition ──────────────────────────────────────────────
const isTransitioning = ref(false);

function triggerMemoryReturn() {
  if (isTransitioning.value) return;
  isTransitioning.value = true;
  setTimeout(() => {
    router.push("/");
  }, 1500);
}
// ────────────────────────────────────────────────────────────────────────────

// Data
const bibliographies = ref([]);
const categories = ref([]);
const isLoading = ref(true);
const formData = ref({
  title: "",
  publish_year: "",
  publisher: "",
  category_id: "",
});
const newCategoryName = ref("");
const selectedFileName = ref("");
const coverInput = ref(null);
const isSubmitting = ref(false);
const isDeletingId = ref(null);
const submitMessage = ref("");
const submitMessageType = ref("");
const gridContainer = ref(null);
const detailModalOpen = ref(false);
const selectedItem = ref(null);

// 管理模式相关
const showAdmin = ref(false);
const adminFilterCategory = ref(null);
const draggedBookId = ref(null);
const draggedOverBookId = ref(null);

// 快速排序相关
const sortingBookId = ref(null);

// 移动端排序模式
const isMobileOrderMode = ref(false);

// Animation
const animationQueue = ref([]);
let queueProcessing = false;

// Fetch categories
const fetchCategories = async () => {
  try {
    const response = await api.get("/api/biblio-categories");
    categories.value = response.data.categories || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
  }
};

// Create new category
const createNewCategory = async () => {
  if (!newCategoryName.value.trim()) return;

  try {
    const response = await api.post("/api/biblio-categories", {
      name: newCategoryName.value.trim(),
    });
    const newCat = response.data.category;
    categories.value.push(newCat);
    formData.value.category_id = newCat.id;
    newCategoryName.value = "";
  } catch (error) {
    console.error("Failed to create category:", error);
    if (error.response?.status === 409) {
      alert("Category already exists!");
    }
  }
};

// 管理模式下的过滤列表
const filteredBibliographies = computed(() => {
  if (!adminFilterCategory.value) {
    return bibliographies.value;
  }
  return bibliographies.value.filter(b => b.category_id === adminFilterCategory.value);
});

// Fetch bibliography from API
const fetchBibliography = async () => {
  isLoading.value = true;
  try {
    console.log("📚 Fetching bibliography from API...");
    const response = await api.get("/api/bibliography");

    const data = response.data.bibliography || [];
    console.log(`✅ Fetched ${data.length} bibliography records:`, data);

    bibliographies.value = data;

    await nextTick();
    initializeAnimationObserver();
  } catch (error) {
    console.error("❌ Failed to fetch bibliography:", error);
    if (error.response?.status === 401) {
      console.warn("⚠️  Unauthorized - some features may be disabled");
    }
  } finally {
    isLoading.value = false;
  }
};

// Handle cover file selection
const onCoverSelect = (event) => {
  const file = event.target.files?.[0];
  if (file) {
    selectedFileName.value = file.name;
  }
};

// Handle image load error
const onImageError = (event) => {
  console.warn("⚠️  Failed to load image:", event.target.src);
};

// Open detail modal
const openDetails = (item) => {
  selectedItem.value = item;
  detailModalOpen.value = true;
};

// Add bibliography
const addBibliography = async () => {
  if (!formData.value.title.trim()) {
    submitMessage.value = "Title is required";
    submitMessageType.value = "error";
    return;
  }

  isSubmitting.value = true;
  submitMessage.value = "";

  try {
    const form = new FormData();
    form.append("title", formData.value.title);
    form.append("publish_year", formData.value.publish_year);
    form.append("publisher", formData.value.publisher);
    form.append("category_id", formData.value.category_id);

    if (coverInput.value?.files?.[0]) {
      form.append("cover", coverInput.value.files[0]);
    }

    console.log("📤 Uploading new bibliography record...");
    const response = await api.post("/api/bibliography", form);

    console.log("✅ Upload successful:", response.data.bibliography);

    bibliographies.value.unshift(response.data.bibliography);

    formData.value = {
      title: "",
      publish_year: "",
      publisher: "",
      category_id: "",
    };
    selectedFileName.value = "";
    if (coverInput.value) {
      coverInput.value.value = "";
    }

    submitMessage.value = "Bibliography added successfully!";
    submitMessageType.value = "success";

    await nextTick();
    initializeAnimationObserver();

    setTimeout(() => {
      submitMessage.value = "";
    }, 3000);
  } catch (error) {
    console.error("❌ Failed to add bibliography:", error);
    submitMessage.value =
      error.response?.data?.error || "Failed to add bibliography";
    submitMessageType.value = "error";
  } finally {
    isSubmitting.value = false;
  }
};

// Delete bibliography
const deleteBibliography = async (id) => {
  if (!confirm("Are you sure you want to delete this record?")) {
    return;
  }

  isDeletingId.value = id;

  try {
    console.log("🗑️  Deleting bibliography record:", id);
    await api.delete(`/api/bibliography/${id}`);

    console.log("✅ Delete successful");
    bibliographies.value = bibliographies.value.filter((item) => item.id !== id);
  } catch (error) {
    console.error("❌ Failed to delete bibliography:", error);
    alert("Failed to delete record");
  } finally {
    isDeletingId.value = null;
  }
};

// 拖动排序逻辑
function onDragStart(bookId) {
  draggedBookId.value = bookId;
}

function onDragOver(e, bookId) {
  e.preventDefault();
  draggedOverBookId.value = bookId;
}

function onDragLeave() {
  draggedOverBookId.value = null;
}

async function onDrop(e, targetBookId) {
  e.preventDefault();
  draggedOverBookId.value = null;
  
  if (draggedBookId.value === targetBookId) {
    draggedBookId.value = null;
    return;
  }

  const sourceBook = bibliographies.value.find(b => b.id === draggedBookId.value);
  const targetBook = bibliographies.value.find(b => b.id === targetBookId);

  if (!sourceBook || !targetBook) return;

  const allBooks = [...bibliographies.value];
  const sourceIndex = allBooks.findIndex(b => b.id === draggedBookId.value);
  const targetIndex = allBooks.findIndex(b => b.id === targetBookId);

  if (sourceIndex === -1 || targetIndex === -1) return;

  [allBooks[sourceIndex], allBooks[targetIndex]] = [allBooks[targetIndex], allBooks[sourceIndex]];

  const orders = allBooks.map((book, index) => ({
    id: book.id,
    display_order: allBooks.length - index
  }));

  try {
    await api.patch("/api/bibliography/order", { orders });
    await fetchBibliography();
  } catch (e) {
    console.error("Failed to update book order:", e);
    alert("更新排序失败，请重试");
  }

  draggedBookId.value = null;
}

async function moveBookToTop(bookId) {
  try {
    sortingBookId.value = bookId;
    const allBooks = [...bibliographies.value];
    const currentIndex = allBooks.findIndex(b => b.id === bookId);
    
    if (currentIndex <= 0) return;
    
    const [book] = allBooks.splice(currentIndex, 1);
    allBooks.unshift(book);
    
    const orders = allBooks.map((b, index) => ({
      id: b.id,
      display_order: allBooks.length - index
    }));
    
    await api.patch("/api/bibliography/order", { orders });
    await fetchBibliography();
  } catch (e) {
    console.error("Failed to move book to top:", e);
    alert("操作失败，请重试");
  } finally {
    sortingBookId.value = null;
  }
}

async function moveBookToBottom(bookId) {
  try {
    sortingBookId.value = bookId;
    const allBooks = [...bibliographies.value];
    const currentIndex = allBooks.findIndex(b => b.id === bookId);
    
    if (currentIndex >= allBooks.length - 1) return;
    
    const [book] = allBooks.splice(currentIndex, 1);
    allBooks.push(book);
    
    const orders = allBooks.map((b, index) => ({
      id: b.id,
      display_order: allBooks.length - index
    }));
    
    await api.patch("/api/bibliography/order", { orders });
    await fetchBibliography();
  } catch (e) {
    console.error("Failed to move book to bottom:", e);
    alert("操作失败，请重试");
  } finally {
    sortingBookId.value = null;
  }
}

function jumpToPosition(currentIndex) {
  const total = bibliographies.value.length;
  const targetInput = prompt(
    `移至位置 (1-${total}):`,
    currentIndex + 1
  );
  
  if (!targetInput) return;
  
  const newIndex = parseInt(targetInput) - 1;
  
  if (isNaN(newIndex) || newIndex < 0 || newIndex >= total || newIndex === currentIndex) {
    alert("位置无效");
    return;
  }
  
  const bookId = filteredBibliographies.value[currentIndex].id;
  const realCurrentIndex = bibliographies.value.findIndex(b => b.id === bookId);
  
  const [movedItem] = bibliographies.value.splice(realCurrentIndex, 1);
  bibliographies.value.splice(newIndex, 0, movedItem);
}

async function saveCustomOrder() {
  try {
    sortingBookId.value = "saving";
    
    const total = bibliographies.value.length;
    const orders = bibliographies.value.map((book, index) => ({
      id: book.id,
      display_order: total - index
    }));

    if (orders.length === 0) {
      alert("请设置书籍位置");
      return;
    }

    await api.patch("/api/bibliography/order", { orders });
    await fetchBibliography();
    
    isMobileOrderMode.value = false;
    alert("排序已保存");
  } catch (e) {
    console.error("Failed to save custom order:", e);
    alert("保存失败，请重试");
  } finally {
    sortingBookId.value = null;
  }
}

const processQueue = async () => {
  if (queueProcessing) return;
  queueProcessing = true;

  while (animationQueue.value.length > 0) {
    const cell = animationQueue.value.shift();
    if (cell) {
      cell.classList.add("visible");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  queueProcessing = false;
};

const initializeAnimationObserver = () => {
  const cells = gridContainer.value?.querySelectorAll(".biblio-cell");

  if (!cells || cells.length === 0) {
    console.warn("⚠️  No cells found for animation");
    return;
  }

  console.log(`🎬 Initializing animation for ${cells.length} cells`);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.classList.contains("visible")) {
          console.log("📍 Cell entering viewport, adding to queue");
          animationQueue.value.push(entry.target);
          processQueue();
        }
      });
    },
    { threshold: 0.1 }
  );

  cells.forEach((cell) => {
    if (!cell.classList.contains("visible")) {
      observer.observe(cell);
    }
  });
};

onMounted(() => {
  console.log("🚀 BibliographyView mounted");
  fetchCategories();
  fetchBibliography();
});
</script>

<style scoped>
/* ── Cinematic transition overlay ─────────────────────────────────────────── */
.memory-transition-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  opacity: 0;
  pointer-events: none;
  z-index: 99999;
  /* backdrop-filter animates separately so blur starts slightly after the
     black fade begins — gives a "lens losing focus" feel */
  backdrop-filter: blur(0px);
  transition:
    opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1),
    backdrop-filter 1.8s ease-in-out;
}

.memory-transition-overlay.is-transitioning {
  opacity: 1;
  pointer-events: auto;
  backdrop-filter: blur(18px);
}
/* ─────────────────────────────────────────────────────────────────────────── */

/* ── Return cell ──────────────────────────────────────────────────────────── */
.return-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #0a0a0a;
  min-height: 280px;
  transition: background 1s ease;
  outline: none;
}

.return-cell:hover,
.return-cell:focus-visible {
  background: #111;
}

.return-content {
  text-align: center;
  padding: 2rem;
}

.return-text {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 200;
  letter-spacing: 0.55em;
  color: #333;
  text-transform: uppercase;
  line-height: 2.8;
  /* Two properties animate on hover: spacing opens, colour lifts */
  transition:
    color 1s ease,
    letter-spacing 1s ease,
    text-shadow 1s ease;
}

.return-cell:hover .return-text,
.return-cell:focus-visible .return-text {
  color: #999;
  letter-spacing: 0.75em;
  text-shadow: 0 0 18px rgba(255, 255, 255, 0.12);
}
/* ─────────────────────────────────────────────────────────────────────────── */

.bibliography-container {
  background: #111111;
  color: #ddd;
  min-height: 100vh;
}

/* 管理按钮 */
.admin-controls {
  padding: 2rem 5%;
  border-bottom: 1px solid #333;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

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

.btn-admin:hover {
  color: #fff;
  border-color: #999;
}

/* 拖动排序管理面板 */
.admin-manage-panel {
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

.admin-empty {
  font-size: 0.85rem;
  color: #555;
  padding: 1rem 0;
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

/* 书籍拖动排序列表 */
.books-drag-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.book-drag-item {
  display: grid;
  grid-template-columns: 50px 100px 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: #222;
  border: 1px solid #333;
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
}

.book-drag-item:active {
  cursor: grabbing;
}

.book-drag-item.dragging {
  opacity: 0.5;
  background: #1a1a1a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.book-drag-item.dragover {
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

.book-thumb {
  width: 100px;
  height: 100px;
  object-fit: cover;
  background: #111;
  border: 1px solid #333;
}

.book-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #444;
  font-size: 0.7rem;
}

.book-info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.book-title {
  font-size: 0.85rem;
  color: #ddd;
  font-weight: 400;
}

.book-category {
  font-size: 0.7rem;
  color: #666;
  text-transform: uppercase;
}

.book-year {
  font-size: 0.7rem;
  color: #555;
}

/* Admin Panel */
.admin-panel {
  background: transparent;
  border: none;
  padding: 3rem 5%;
  margin: 0;
  border-radius: 0;
  max-width: 100%;
  border-bottom: 1px solid #333;
}

.admin-panel h2 {
  font-size: 0.68rem;
  font-weight: 400;
  letter-spacing: 0.55em;
  text-transform: uppercase;
  margin: 0 0 2rem 0;
  color: #666;
  padding: 0;
}

.admin-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: #555;
  font-weight: 400;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.form-group input,
.form-group input[type="file"],
.category-select {
  padding: 0.7rem;
  background: #1a1a1a;
  border: 1px solid #333;
  color: #ddd;
  font-size: 0.85rem;
  border-radius: 0;
  transition: border-color 0.2s;
}

.form-group input:focus,
.category-select:focus {
  outline: none;
  border-color: #555;
}

.category-select option {
  background: #1a1a1a;
  color: #ddd;
}

.new-category-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.new-category-input {
  flex: 1;
  padding: 0.5rem;
  background: #1a1a1a;
  border: 1px solid #333;
  color: #ddd;
  font-size: 0.8rem;
  border-radius: 0;
  transition: border-color 0.2s;
}

.new-category-input:focus {
  outline: none;
  border-color: #555;
}

.btn-create-category {
  padding: 0.5rem 1rem;
  background: transparent;
  color: #666;
  border: 1px solid #333;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  font-weight: 400;
}

.btn-create-category:hover:not(:disabled) {
  color: #fff;
  border-color: #999;
}

.btn-create-category:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.file-name {
  font-size: 0.75rem;
  color: #555;
  margin-top: 0.3rem;
  word-break: break-all;
  font-weight: 400;
}

.btn-submit {
  background: transparent;
  color: #666;
  border: 1px solid #333;
  padding: 0.7rem 1.5rem;
  cursor: pointer;
  border-radius: 0;
  font-size: 0.75rem;
  transition: all 0.2s;
  grid-column: 1 / -1;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: 400;
}

.btn-submit:hover:not(:disabled) {
  color: #fff;
  border-color: #999;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-message {
  grid-column: 1 / -1;
  padding: 0.7rem;
  border-radius: 0;
  font-size: 0.8rem;
  margin: 0;
}

.success {
  background: #1a3a1a;
  color: #90ee90;
  border: 1px solid #2d5a2d;
}

.error {
  background: #3a1a1a;
  color: #ff8080;
  border: 1px solid #5a2d2d;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem 5%;
  color: #555;
  font-size: 0.85rem;
  background: #111111;
  border-bottom: 1px solid #333;
}

/* Grid Layout */
.biblio-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-top: 1px solid #333;
  border-left: 1px solid #333;
  gap: 0;
  margin: 0;
  max-width: 100%;
}

/* Responsive Grid */
@media (max-width: 1400px) {
  .biblio-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1000px) {
  .biblio-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .biblio-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .biblio-cell {
    padding: 1rem 0.75rem;
  }

  .cover-container {
    height: 160px;
    margin-bottom: 1rem;
  }

  .mobile-order-item {
    grid-template-columns: 70px 1fr 50px;
    gap: 0.75rem;
    padding: 0.6rem;
  }

  .mobile-order-list {
    max-height: 400px;
  }

  .btn-save-order {
    padding: 0.6rem 1rem;
    font-size: 0.8rem;
  }

  .btn-toggle-order-mode {
    padding: 0.4rem 0.8rem;
    font-size: 0.7rem;
  }
}

/* Grid Cell */
.biblio-cell {
  border-right: 1px solid #333;
  border-bottom: 1px solid #333;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.4s ease, transform 0.4s ease;
  background: #111111;
}

.biblio-cell.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Cover Image Container */
.cover-container {
  height: 200px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.book-cover {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  overflow: hidden;
}

.cover-image {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  filter: grayscale(100%);
  transition: filter 0.3s ease;
}

.book-cover:hover .cover-image {
  filter: grayscale(0%);
}

.cover-placeholder {
  color: #444;
  font-size: 0.75rem;
  text-align: center;
}

.view-details-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 400;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.book-cover:hover .view-details-overlay {
  opacity: 1;
}

/* Cell Title */
.cell-title {
  font-size: 0.95rem;
  color: #ddd;
  margin: 0 0 1.2rem 0;
  line-height: 1.5;
  flex-grow: 1;
  font-weight: 300;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* Cell Meta Info */
.cell-meta {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.meta-row {
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
  font-size: 0.75rem;
}

.meta-label {
  color: #555;
  font-weight: 400;
  letter-spacing: 0.02em;
  min-width: 50px;
  text-transform: uppercase;
}

.meta-value {
  color: #999;
  flex: 1;
  word-break: break-word;
}

.category-display {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.8rem;
  border-top: 1px solid #333;
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

/* Delete Button */
.btn-delete {
  margin-top: 1.2rem;
  padding: 0.5rem 0.8rem;
  background: transparent;
  color: #555;
  border: 1px solid #333;
  border-radius: 0;
  cursor: pointer;
  font-size: 0.7rem;
  transition: all 0.2s;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  font-weight: 400;
}

.btn-delete:hover:not(:disabled) {
  background: transparent;
  color: #ff6b6b;
  border-color: #ff6b6b;
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 书籍操作按钮组 */
.book-actions {
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

.book-actions .btn-delete {
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
  margin-top: 0;
}

.book-actions .btn-delete:hover:not(:disabled) {
  color: #ff6b6b;
  border-color: #ff6b6b;
}

.book-actions .btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 排序模式切换按钮 */
.btn-toggle-order-mode {
  padding: 0.5rem 1rem;
  background: transparent;
  color: #666;
  border: 1px solid #333;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  font-weight: 400;
  letter-spacing: 0.05em;
}

.btn-toggle-order-mode:hover {
  color: #999;
  border-color: #666;
}

/* 移动端排序列表 */
.mobile-order-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mobile-order-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 500px;
  overflow-y: auto;
  padding: 0.5rem;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 0.25rem;
}

.mobile-order-item {
  display: grid;
  grid-template-columns: 80px 1fr 60px;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  background: #222;
  border: 1px solid #333;
  border-radius: 0.25rem;
}

.order-position {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.position-label {
  font-size: 0.75rem;
  color: #666;
  white-space: nowrap;
}

.order-book-info {
  min-width: 0;
}

.order-title {
  display: block;
  font-size: 0.85rem;
  color: #ddd;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-buttons {
  display: flex;
  gap: 0.25rem;
}

.btn-order-arrow {
  flex: 1;
  padding: 0.4rem;
  background: transparent;
  color: #666;
  border: 1px solid #333;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 0.2rem;
}

.btn-order-arrow:hover:not(:disabled) {
  color: #66b3ff;
  border-color: #66b3ff;
  background: rgba(102, 179, 255, 0.1);
}

.btn-order-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-save-order {
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: #999;
  border: 1px solid #444;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  font-weight: 400;
  letter-spacing: 0.05em;
  border-radius: 0.25rem;
}

.btn-save-order:hover:not(:disabled) {
  color: #66b3ff;
  border-color: #66b3ff;
  background: rgba(102, 179, 255, 0.05);
}

.btn-save-order:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 5%;
  color: #555;
  font-size: 0.9rem;
  background: #111111;
  border-top: 1px solid #333;
}
</style>