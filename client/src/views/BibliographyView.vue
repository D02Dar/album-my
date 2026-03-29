<template>
  <div class="bibliography-container">
    <!-- Admin Panel -->
    <div v-if="isAuthenticated" class="admin-panel">
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
        <!-- Cover Image -->
        <div class="cover-container">
          <img
            v-if="item.cover_url"
            :src="item.cover_url"
            :alt="item.title"
            class="cover-image"
            @error="onImageError"
          />
          <div v-else class="cover-placeholder">No Image</div>
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
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && bibliographies.length === 0" class="empty-state">
      <p>No bibliography records yet.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { useAuthStore } from "../stores/auth";
import api from "../api";

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);

// Data
const bibliographies = ref([]);
const isLoading = ref(true);
const formData = ref({
  title: "",
  publish_year: "",
  publisher: "",
});
const selectedFileName = ref("");
const coverInput = ref(null);
const isSubmitting = ref(false);
const isDeletingId = ref(null);
const submitMessage = ref("");
const submitMessageType = ref("");
const gridContainer = ref(null);

// Animation
const animationQueue = ref([]);
let queueProcessing = false;

// Fetch bibliography from API
const fetchBibliography = async () => {
  isLoading.value = true;
  try {
    console.log("📚 Fetching bibliography from API...");
    const response = await api.get("/api/bibliography");
    
    const data = response.data.bibliography || [];
    console.log(`✅ Fetched ${data.length} bibliography records:`, data);
    
    bibliographies.value = data;
    
    // Wait for DOM to render, then initialize animation
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

    if (coverInput.value?.files?.[0]) {
      form.append("cover", coverInput.value.files[0]);
    }

    console.log("📤 Uploading new bibliography record...");
    const response = await api.post("/api/bibliography", form);

    console.log("✅ Upload successful:", response.data.bibliography);
    
    // Add to beginning of list
    bibliographies.value.unshift(response.data.bibliography);
    
    // Reset form
    formData.value = {
      title: "",
      publish_year: "",
      publisher: "",
    };
    selectedFileName.value = "";
    if (coverInput.value) {
      coverInput.value.value = "";
    }
    
    submitMessage.value = "Bibliography added successfully!";
    submitMessageType.value = "success";
    
    // Reinitialize animation for new items
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

// Process animation queue sequentially
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

// Initialize IntersectionObserver for staggered animation
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

// Load data on mount
onMounted(() => {
  console.log("🚀 BibliographyView mounted");
  fetchBibliography();
});
</script>

<style scoped>
.bibliography-container {
  background: #111111;
  color: #ddd;
  min-height: 100vh;
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
.form-group input[type="file"] {
  padding: 0.7rem;
  background: #1a1a1a;
  border: 1px solid #333;
  color: #ddd;
  font-size: 0.85rem;
  border-radius: 0;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #555;
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
    grid-template-columns: 1fr;
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

.cover-image {
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  filter: grayscale(100%);
  transition: filter 0.3s ease;
}

.biblio-cell:hover .cover-image {
  filter: grayscale(0%);
}

.cover-placeholder {
  color: #444;
  font-size: 0.75rem;
  text-align: center;
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
  gap: 0.5rem;
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
  color: #fff;
  border-color: #666;
}

.btn-delete:disabled {
  opacity: 0.6;
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
