<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useUiStore } from "../stores/ui";

const router = useRouter();
const auth = useAuthStore();
const ui = useUiStore();

const isAuthenticated = computed(() => auth.isAuthenticated);

// Navigation items with labels and routes
const navItems = ref([
  { label: "INDEX", path: "/" },
  { label: "GALLERY", path: "/gallery" },
  { label: "BIBLIOGRAPHY", path: "/bibliography" },
  { label: "ABOUT", path: "/about" },
]);

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
  <Transition name="portal-fade">
    <div v-if="ui.menuOpen" class="navigation-portal">
      <!-- Close button -->
      <button 
        class="close-btn" 
        @click="ui.closeMenu" 
        aria-label="Close menu"
      >
        <span class="close-icon">✕</span>
      </button>

      <!-- Main navigation -->
      <nav class="portal-content">
        <div
          v-for="(item, index) in navItems"
          :key="item.label"
          class="nav-item"
          :style="{ '--item-index': index }"
        >
          <button
            :class="['nav-link', { active: $route.path === item.path }]"
            @click="navigateTo(item.path)"
          >
            {{ item.label }}
          </button>
        </div>

        <!-- Auth section -->
        <div class="nav-divider" :style="{ '--item-index': navItems.length }"></div>
        
        <div 
          v-if="!isAuthenticated"
          class="nav-item auth-item"
          :style="{ '--item-index': navItems.length + 1 }"
        >
          <button class="nav-link nav-link--secondary" @click="navigateTo('/login')">
            LOGIN
          </button>
        </div>

        <div 
          v-if="isAuthenticated"
          class="nav-item auth-item"
          :style="{ '--item-index': navItems.length + 1 }"
        >
          <button class="nav-link nav-link--secondary" @click="navigateTo('/bibliography')">
            BIBLIOGRAPHY
          </button>
        </div>

        <div 
          v-if="isAuthenticated"
          class="nav-item auth-item"
          :style="{ '--item-index': navItems.length + 2 }"
        >
          <button class="nav-link nav-link--danger" @click="logout">
            LOGOUT
          </button>
        </div>
      </nav>

      <!-- Footer hint (optional) -->
      <div class="portal-footer">
        <p class="footer-text">Close</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

.navigation-portal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Close button - positioned at top right */
.close-btn {
  position: absolute;
  top: 2.5rem;
  right: 3rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid #444;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0;
  z-index: 10001;
}

.close-btn:hover {
  border-color: #fff;
  transform: rotate(90deg);
}

.close-icon {
  color: #888;
  font-size: 1.5rem;
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover .close-icon {
  color: #fff;
}

/* Main navigation content */
.portal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
  padding: 3rem;
  max-width: 800px;
}

/* Navigation items with staggered chase animation */
.nav-item {
  position: relative;
  opacity: 0;
  animation: chase-fade-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(var(--item-index) * 0.05s);
}

@keyframes chase-fade-in {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Navigation links */
.nav-link {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 3.5rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #ccc;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem 0;
  margin: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: inline-block;
}

.nav-link::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0%;
  height: 2px;
  background: #fff;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link:hover {
  color: #fff;
  transform: scale(1.05);
}

.nav-link:hover::before {
  width: 100%;
}

.nav-link.active {
  color: #fff;
}

.nav-link.active::before {
  width: 100%;
}

/* Secondary links (LOGIN, BIBLIOGRAPHY) */
.nav-link--secondary {
  font-size: 1.2rem;
  letter-spacing: 0.08em;
  font-weight: 400;
  color: #888;
}

.nav-link--secondary:hover {
  color: #fff;
  transform: scale(1.1);
}

/* Danger links (LOGOUT) */
.nav-link--danger {
  font-size: 1.2rem;
  letter-spacing: 0.08em;
  font-weight: 400;
  color: #888;
}

.nav-link--danger:hover {
  color: #ff6b6b;
  transform: scale(1.1);
}

/* Auth section styling */
.auth-item {
  margin-top: 1rem;
}

.nav-divider {
  width: 80%;
  height: 1px;
  background: linear-gradient(to right, transparent, #444, transparent);
  opacity: 0;
  animation: chase-fade-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: calc(var(--item-index) * 0.05s);
}

/* Portal footer */
.portal-footer {
  position: absolute;
  bottom: 3rem;
  text-align: center;
  opacity: 0;
  animation: fade-in 0.8s ease-out 0.5s forwards;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.footer-text {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #666;
  margin: 0;
  font-weight: 300;
}

/* Portal fade transition */
.portal-fade-enter-active,
.portal-fade-leave-active {
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(0px);
  -webkit-backdrop-filter: blur(0px);
}

.portal-fade-enter-active {
  transition: opacity 0.4s ease-out;
}

.portal-fade-leave-active {
  transition: opacity 0.3s ease-in;
}

.portal-fade-enter-from,
.portal-fade-leave-to {
  opacity: 0;
}

.portal-fade-enter-from .nav-item,
.portal-fade-leave-to .nav-item {
  opacity: 0;
  transform: translateY(10px);
}

/* Responsive design */
@media (max-width: 768px) {
  .navigation-portal {
    padding: 2rem;
  }

  .close-btn {
    top: 1.5rem;
    right: 1.5rem;
  }

  .portal-content {
    gap: 1.5rem;
    padding: 1rem;
  }

  .nav-link {
    font-size: 2.5rem;
  }

  .nav-link--secondary,
  .nav-link--danger {
    font-size: 1rem;
  }

  .nav-divider {
    width: 100%;
  }

  .portal-footer {
    bottom: 1.5rem;
  }
}

@media (max-width: 480px) {
  .nav-link {
    font-size: 1.8rem;
  }

  .close-btn {
    width: 40px;
    height: 40px;
  }

  .close-icon {
    font-size: 1.2rem;
  }
}
</style>
