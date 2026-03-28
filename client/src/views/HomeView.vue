<script setup>
import { RouterLink } from "vue-router";
import { useAuthStore } from "../stores/auth";
import GalleryAccordion from "../components/GalleryAccordion.vue";

const auth = useAuthStore();

async function onLogout() {
  await auth.logout();
}
</script>

<template>
  <div class="home">
    <header class="site-header">
      <RouterLink to="/" class="site-header__brand">PHOTOGALLERY</RouterLink>
      <nav class="site-header__nav">
        <RouterLink v-if="!auth.isAuthenticated" to="/login">登录</RouterLink>
        <template v-else>
          <RouterLink to="/upload">上传</RouterLink>
          <button type="button" class="linkish" @click="onLogout">退出</button>
        </template>
      </nav>
    </header>
    <GalleryAccordion />
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background: #111111;
}

.site-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 3rem 3vw 2rem;
  max-width: 960px;
  margin: 0 auto;
  border-bottom: 1px solid rgba(238, 238, 238, 0.12);
}

.site-header__brand {
  font-size: 0.68rem;
  font-weight: 400;
  letter-spacing: 0.55em;
  text-transform: uppercase;
  border: none;
  padding: 0;
  color: #999999;
}

.site-header__brand:hover {
  color: #eeeeee;
}

.site-header__nav {
  display: flex;
  gap: 2rem;
  align-items: center;
  font-size: 0.65rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
}

.site-header__nav a {
  border: none;
  color: #999999;
}

.site-header__nav a:hover {
  color: #eeeeee;
}

.linkish {
  font-size: 0.65rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  border: none;
  background: none;
  padding: 0;
  color: #999999;
}

.linkish:hover:not(:disabled) {
  background: none;
  color: #eeeeee;
  opacity: 1;
}
</style>
