import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "../api";

/** 将原版 photos 行映射为手风琴/灯箱所需字段（缩略图与大图共用 url） */
function toAccordionSet(rows) {
  if (!rows.length) return [];
  return [
    {
      id: "all",
      name: "GALLERY",
      photos: rows.map((p) => ({
        id: p.id,
        full_url: p.url,
        thumb_url: p.url,
        alt: p.title || "",
      })),
    },
  ];
}

export const useGalleryStore = defineStore("gallery", () => {
  const photos = ref([]);
  const loadError = ref(null);

  const accordionSets = computed(() => toAccordionSet(photos.value));

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

  async function uploadPhoto(file, title) {
    const body = new FormData();
    body.append("image", file);
    if (title && title.trim()) body.append("title", title.trim());
    const { data } = await api.post("/api/photos/upload", body);
    if (data.photo) photos.value = [data.photo, ...photos.value];
    return data.photo;
  }

  return {
    photos,
    accordionSets,
    loadError,
    fetchPhotos,
    uploadPhoto,
  };
});
