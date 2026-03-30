import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "../api";

/** 将 photos 按分类分组为手风琴行 */
function toAccordionSets(rows) {
  if (!rows.length) return [];

  // 按分类分组
  const grouped = {};
  rows.forEach((p) => {
    const catName = p.gallery_categories?.name || "未分类";
    if (!grouped[catName]) {
      grouped[catName] = [];
    }
    grouped[catName].push({
      id: p.id,
      full_url: p.url,
      thumb_url: p.url,
      alt: p.title || "",
    });
  });

  // 转换为手风琴行数组
  return Object.entries(grouped).map(([catName, photos]) => ({
    id: catName,
    name: catName,
    photos,
  }));
}

export const useGalleryStore = defineStore("gallery", () => {
  const photos = ref([]);
  const categories = ref([]);
  const loadError = ref(null);

  const accordionSets = computed(() => toAccordionSets(photos.value));

  async function fetchPhotos() {
    loadError.value = null;
    try {
      const { data } = await api.get("/api/photos");
      photos.value = data.photos ?? [];
    } catch (e) {
      loadError.value =
        e.response?.data?.error ?? e.message ?? "加载失败";
      photos.value = [];
    }
  }

  async function fetchCategories() {
    try {
      const { data } = await api.get("/api/gallery-categories");
      categories.value = data.categories ?? [];
    } catch (e) {
      console.error("Failed to fetch gallery categories:", e);
      categories.value = [];
    }
  }

  async function createCategory(name) {
    const { data } = await api.post("/api/gallery-categories", { name });
    if (data.category) {
      categories.value.push(data.category);
    }
    return data.category;
  }

  async function uploadPhoto(file, title, categoryId) {
    const body = new FormData();
    body.append("image", file);
    if (title && title.trim()) body.append("title", title.trim());
    if (categoryId) body.append("category_id", categoryId);
    const { data } = await api.post("/api/photos/upload", body);
    if (data.photo) photos.value = [data.photo, ...photos.value];
    return data.photo;
  }

  async function deletePhoto(photoId) {
    await api.delete(`/api/photos/${photoId}`);
    photos.value = photos.value.filter(p => p.id !== photoId);
  }

  async function updatePhotoOrder(orders) {
    // orders: Array of { id, display_order }
    await api.patch("/api/photos/order", { orders });
    // 更新本地状态
    orders.forEach(({ id, display_order }) => {
      const photo = photos.value.find(p => p.id === id);
      if (photo) {
        photo.display_order = display_order;
      }
    });
  }

  return {
    photos,
    categories,
    accordionSets,
    loadError,
    fetchPhotos,
    fetchCategories,
    createCategory,
    uploadPhoto,
    deletePhoto,
    updatePhotoOrder,
  };
});
