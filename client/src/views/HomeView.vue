<script setup>
import { ref, onMounted, computed } from "vue";
import api from "../api"; // 确保你的项目里有配置好的 api 实例

// 存储从后端获取的主页推荐图片
const featuredPhotos = ref([]);

// 默认兜底的高级占位图（完美适配这个 7 格排版）
const defaultPhotos = [
  { id: '1', url: 'https://images.unsplash.com/photo-1549488331-48350163359d?w=800&fit=crop' },
  { id: '2', url: 'https://images.unsplash.com/photo-1563220473-b265691d1e4e?w=800&fit=crop' },
  { id: '3', url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&fit=crop' },
  { id: '4', url: 'https://images.unsplash.com/photo-1549887552-cb1071d3e5ca?w=1000&fit=crop' },
  { id: '5', url: 'https://images.unsplash.com/photo-1628189689408-592a3b022143?w=800&fit=crop' },
  { id: '6', url: 'https://images.unsplash.com/photo-1551334787-21e6bd3ab135?w=800&fit=crop' },
  { id: '7', url: 'https://images.unsplash.com/photo-1511407397940-d57f68e81203?w=800&fit=crop' }
];

// 获取主页推荐图片
const fetchFeaturedPhotos = async () => {
  try {
    // 假设你之后会在后端实现这个接口：只拉取 is_home_featured = true 的图片
    const response = await api.get('/api/photos/featured');
    if (response.data && response.data.length > 0) {
      featuredPhotos.value = response.data;
    }
  } catch (error) {
    console.log("Using default editorial images (API not ready or empty)");
  }
};

// 计算属性：如果有真实数据就用前 7 张，否则用兜底图。保证排版不崩。
const displayPhotos = computed(() => {
  const photosToUse = featuredPhotos.value.length > 0 ? featuredPhotos.value : defaultPhotos;
  return photosToUse.slice(0, 7); // 严格截取 7 张以适配 CSS Grid 的 nth-child
});

onMounted(() => {
  fetchFeaturedPhotos();
});
</script>

<template>
  <div class="editorial-home">
    <div class="corner-text top-left">MORIYAMA / EDITORIAL</div>
    
    <div class="corner-text top-right">MENU</div>
    
    <div class="corner-text bottom-left">LTD. EDITION VOL 01</div>

    <main class="editorial-grid">
      <div 
        v-for="photo in displayPhotos" 
        :key="photo.id" 
        class="grid-item"
      >
        <img :src="photo.url || photo.image_url" :alt="photo.title || 'Editorial Photography'">
      </div>
    </main>

    <div class="hero-overlay">
      <h1 class="hero-title">愛 密 集</h1>
      <div class="hero-subtitle">FRAGMENTS OF TIME & SPACE</div>
    </div>
  </div>
</template>

<style scoped>
.editorial-home {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: #050505;
  color: #fff;
  overflow: hidden;
  /* 抵消如果 App.vue 有全局 padding 的影响 */
  margin-left: calc(-50vw + 50%);
}

/* 极简编辑排版：边角小字 */
.corner-text { 
  position: absolute; /* 这里用 absolute 限制在组件内 */
  font-size: 0.6rem; 
  letter-spacing: 4px; 
  color: #555; 
  text-transform: uppercase; 
  z-index: 100; 
}

.top-left { 
  top: 2rem; 
  left: 2rem; 
}

.top-right { 
  top: 2rem; 
  right: 2rem; 
  display: flex; 
  align-items: center; 
  gap: 10px; 
  cursor: pointer; 
  color: #888; 
  transition: color 0.3s;
}

.top-right:hover { 
  color: #fff; 
}

.top-right::after { 
  content: ''; 
  width: 20px; 
  height: 1px; 
  background: currentColor; 
}

.bottom-left { 
  bottom: 2rem; 
  left: 2rem; 
  writing-mode: vertical-rl; 
  transform: rotate(180deg); 
}

/* 错落有致的背景图片网格 */
.editorial-grid {
  position: absolute; 
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4列基础网格 */
  grid-template-rows: repeat(3, 1fr);    /* 3行基础网格 */
  gap: 2px; /* 图片之间的极细缝隙 */
  background-color: #111;
  z-index: 1;
}

/* 单个图片容器 */
.grid-item { 
  position: relative; 
  overflow: hidden; 
  background: #1a1a1a; 
}

.grid-item img { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
  filter: grayscale(100%) brightness(0.4) contrast(1.2); /* 压暗，确保文字清晰 */
  transition: filter 0.8s ease, transform 0.8s ease; 
}

/* 悬停时微微亮起并放大，暗示图片质感 */
.grid-item:hover img { 
  filter: grayscale(100%) brightness(0.7) contrast(1.2); 
  transform: scale(1.03); 
}

/* === 核心：打破死板，让特定的图片跨行跨列 === */
/* 第1张图，纵向跨2行 */
.grid-item:nth-child(1) { grid-row: span 2; }
/* 第4张图，横向跨2列 */
.grid-item:nth-child(4) { grid-column: span 2; }
/* 第6张图，更大的一块 */
.grid-item:nth-child(6) { grid-row: span 2; }

/* 中央巨大悬浮文字 */
.hero-overlay {
  position: absolute; 
  top: 0; 
  left: 0; 
  width: 100%; 
  height: 100%;
  display: flex; 
  flex-direction: column; 
  justify-content: center; 
  align-items: center;
  z-index: 10; 
  pointer-events: none; /* 防止挡住图片的 Hover 效果 */
}

.hero-title {
  font-size: 8rem; /* 巨大字号 */
  font-weight: 200;
  letter-spacing: 4vw; /* 极宽的字母间距，中文排版适当减小以防断裂 */
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
  margin-right: -4vw; /* 修正因为 letter-spacing 导致的整体偏移 */
  display: flex;
  align-items: center;
  text-shadow: 0 10px 30px rgba(0,0,0,0.5); /* 稍微加点阴影增强层次 */
}

.hero-subtitle {
  font-size: 0.6rem; 
  letter-spacing: 8px; 
  color: #999; 
  margin-top: 1.5rem; 
  text-transform: uppercase;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .editorial-grid { 
    grid-template-columns: repeat(2, 1fr); 
    grid-template-rows: repeat(4, 1fr); 
  }
  .grid-item:nth-child(1) { grid-row: span 1; }
  .grid-item:nth-child(4) { grid-column: span 1; grid-row: span 2; }
  
  .hero-title { 
    font-size: 4rem; 
    letter-spacing: 4vw; 
    margin-right: -4vw; 
  }
  .hero-subtitle {
    font-size: 0.5rem;
    letter-spacing: 4px;
  }
}
</style>