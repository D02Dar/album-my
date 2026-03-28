<template>
  <div class="bibliography-container">
    <!-- Admin Panel -->
    <div v-if="isAuthenticated" class="admin-panel">
      <h2>Admin Panel - Add Bibliography</h2>
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
          <label for="cover_url">Cover URL</label>
          <input
            id="cover_url"
            v-model="formData.cover_url"
            type="url"
            placeholder="https://example.com/cover.jpg"
          />
        </div>

        <button type="submit" class="btn-submit" :disabled="isSubmitting">
          {{ isSubmitting ? "Adding..." : "Add Record" }}
        </button>
        <p v-if="submitMessage" :class="submitMessageType">
          {{ submitMessage }}
        </p>
      </form>
    </div>

    <!-- Bibliography Grid -->
    <h1>Bibliography / Publications</h1>
    <div class="biblio-grid" ref="gridContainer">
      <div
        v-for="item in bibliography"
        :key="item.id"
        class="biblio-cell"
        :ref="`cell-${item.id}`"
      >
        <!-- Cover Image -->
        <div class="cover-container">
          <img
            v-if="item.cover_url"
            :src="item.cover_url"
            :alt="item.title"
            class="cover-image"
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
    <div v-if="bibliography.length === 0" class="empty-state">
      <p>No bibliography records yet.</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/api";

export default {
  name: "BibliographyView",
  setup() {
    const authStore = useAuthStore();
    const isAuthenticated = computed(() => authStore.isAuthenticated);

    const bibliography = ref([]);
    const formData = ref({
      title: "",
      publish_year: "",
      publisher: "",
      cover_url: "",
    });
    const isSubmitting = ref(false);
    const isDeletingId = ref(null);
    const submitMessage = ref("");
    const submitMessageType = ref("");
    const gridContainer = ref(null);

    // Animation queue
    const animationQueue = ref([]);
    let queueProcessing = false;

    // Fetch bibliography
    const fetchBibliography = async () => {
      try {
        const response = await api.get("/api/bibliography");
        bibliography.value = response.data.bibliography || [];
        // Restart animation observer after data loads
        initializeAnimationObserver();
      } catch (error) {
        console.error("Failed to fetch bibliography:", error);
      }
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
        const response = await api.post("/api/bibliography", {
          title: formData.value.title,
          publish_year: formData.value.publish_year,
          publisher: formData.value.publisher,
          cover_url: formData.value.cover_url,
        });

        bibliography.value.unshift(response.data.bibliography);
        formData.value = {
          title: "",
          publish_year: "",
          publisher: "",
          cover_url: "",
        };
        submitMessage.value = "Bibliography added successfully!";
        submitMessageType.value = "success";
        setTimeout(() => {
          submitMessage.value = "";
        }, 3000);
      } catch (error) {
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
        await api.delete(`/api/bibliography/${id}`);
        bibliography.value = bibliography.value.filter((item) => item.id !== id);
      } catch (error) {
        console.error("Failed to delete bibliography:", error);
        alert("Failed to delete record");
      } finally {
        isDeletingId.value = null;
      }
    };

    // Staggered animation with IntersectionObserver
    const processQueue = async () => {
      if (queueProcessing) return;
      queueProcessing = true;

      while (animationQueue.value.length > 0) {
        const cell = animationQueue.value.shift();
        cell.classList.add("visible");
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      queueProcessing = false;
    };

    const initializeAnimationObserver = () => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !entry.target.classList.contains("visible")) {
              animationQueue.value.push(entry.target);
              processQueue();
            }
          });
        },
        { threshold: 0.1 }
      );

      // Observe all cells
      const cells = gridContainer.value?.querySelectorAll(".biblio-cell");
      if (cells) {
        cells.forEach((cell) => {
          if (!cell.classList.contains("visible")) {
            observer.observe(cell);
          }
        });
      }

      return observer;
    };

    onMounted(() => {
      fetchBibliography();
    });

    return {
      bibliography,
      formData,
      isSubmitting,
      isDeletingId,
      submitMessage,
      submitMessageType,
      gridContainer,
      isAuthenticated,
      addBibliography,
      deleteBibliography,
    };
  },
};
</script>

<style scoped>
.bibliography-container {
  background: #1a1a1a;
  color: #ddd;
  padding: 2rem;
  min-height: 100vh;
}

h1 {
  font-size: 2rem;
  margin-bottom: 3rem;
  text-align: center;
  color: #eee;
}

/* Admin Panel */
.admin-panel {
  background: #222;
  border: 1px solid #333;
  padding: 2rem;
  margin-bottom: 3rem;
  border-radius: 4px;
}

.admin-panel h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #eee;
}

.admin-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  color: #999;
  font-weight: 500;
}

.form-group input {
  padding: 0.75rem;
  background: #1a1a1a;
  border: 1px solid #333;
  color: #ddd;
  font-size: 0.95rem;
  border-radius: 2px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #666;
}

.btn-submit {
  background: #555;
  color: #fff;
  border: 1px solid #666;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  border-radius: 2px;
  font-size: 0.95rem;
  transition: background 0.2s;
  grid-column: 1 / -1;
}

.btn-submit:hover:not(:disabled) {
  background: #777;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submitMessage {
  grid-column: 1 / -1;
  padding: 0.75rem;
  border-radius: 2px;
  font-size: 0.9rem;
}

.success {
  background: #2d5a2d;
  color: #90ee90;
  border: 1px solid #4a7c4a;
}

.error {
  background: #5a2d2d;
  color: #ff6b6b;
  border: 1px solid #7c4a4a;
}

/* Grid Layout */
.biblio-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-top: 1px solid #333;
  border-left: 1px solid #333;
  gap: 0;
  margin-bottom: 2rem;
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
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.biblio-cell.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Cover Image Container */
.cover-container {
  height: 180px;
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
  color: #555;
  font-size: 0.85rem;
  text-align: center;
}

/* Cell Title */
.cell-title {
  font-size: 1.1rem;
  color: #eee;
  margin-bottom: 1rem;
  line-height: 1.4;
  flex-grow: 1;
}

/* Cell Meta Info */
.cell-meta {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.meta-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.meta-label {
  color: #555;
  min-width: 50px;
  font-weight: 500;
}

.meta-value {
  color: #999;
  flex: 1;
}

/* Delete Button */
.btn-delete {
  margin-top: 1rem;
  padding: 0.5rem;
  background: #3a2d2d;
  color: #ff6b6b;
  border: 1px solid #5a3d3d;
  border-radius: 2px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.2s;
}

.btn-delete:hover:not(:disabled) {
  background: #4a3d3d;
}

.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #888;
  font-size: 1rem;
}
</style>
