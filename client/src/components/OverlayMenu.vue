<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useUiStore } from "../stores/ui";

const router = useRouter();
const auth = useAuthStore();
const ui = useUiStore();

const isAuthenticated = computed(() => auth.isAuthenticated);

async function navigateTo(path) {
  ui.closeMenu();
  await router.push(path);
}

async function logout() {
  ui.closeMenu();
  await auth.logout();
  await router.push("/");
}
</script>

<template>
  <Transition name="overlay-fade">
    <div v-if="ui.menuOpen" class="overlay-menu">
      <button class="close-btn" @click="ui.closeMenu" aria-label="Close menu">
        ✕
      </button>
      
      <nav class="menu-content">
        <button @click="navigateTo('/')" class="menu-link">
          HOME / GALLERY
        </button>
        <button @click="navigateTo('/bibliography')" class="menu-link">
          BIBLIOGRAPHY
        </button>
        <button
          v-if="isAuthenticated"
          @click="navigateTo('/upload')"
          class="menu-link"
        >
          ADMIN / UPLOAD
        </button>
        <button
          v-if="!isAuthenticated"
          @click="navigateTo('/login')"
          class="menu-link"
        >
          LOGIN
        </button>
        <button
          v-if="isAuthenticated"
          @click="logout"
          class="menu-link menu-link--danger"
        >
          LOGOUT
        </button>
      </nav>
    </div>
  </Transition>
</template>

<style scoped>
.overlay-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn {
  position: absolute;
  top: 2rem;
  right: 3vw;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #333;
  color: #666;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 0;
}

.close-btn:hover {
  border-color: #999;
  color: #fff;
}

.menu-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 0 3vw;
}

.menu-link {
  font-size: 2rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #666;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.3s ease;
  padding: 0;
  margin: 0;
  font-weight: 400;
}

.menu-link:hover {
  color: #fff;
}

.menu-link--danger:hover {
  color: #ff6b6b;
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-fade-enter-active .menu-link,
.overlay-fade-leave-active .menu-link {
  transition: opacity 0.3s ease 0.1s;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

.overlay-fade-enter-from .menu-link,
.overlay-fade-leave-to .menu-link {
  opacity: 0;
}
</style>
