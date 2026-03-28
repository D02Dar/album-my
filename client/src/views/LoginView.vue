<script setup>
import { ref } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const error = ref("");
const busy = ref(false);

async function onSubmit() {
  error.value = "";
  busy.value = true;
  try {
    await auth.login(email.value.trim(), password.value);
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await router.replace(redirect || "/");
  } catch (e) {
    error.value = e.response?.data?.error ?? e.message ?? "登录失败";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="login">
    <RouterLink to="/" class="login__back">返回</RouterLink>
    <form class="login__form" @submit.prevent="onSubmit">
      <h1 class="login__title">登录</h1>
      <label class="login__label">邮箱</label>
      <input v-model="email" type="email" autocomplete="username" required />

      <label class="login__label">密码</label>
      <input v-model="password" type="password" autocomplete="current-password" required />

      <p v-if="error" class="login__error">{{ error }}</p>

      <button type="submit" class="login__submit" :disabled="busy">
        {{ busy ? "…" : "进入" }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #111111;
}

.login__back {
  position: absolute;
  top: 2rem;
  left: 3vw;
  font-size: 0.65rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  border: none;
  color: #999999;
}

.login__back:hover {
  color: #eeeeee;
}

.login__form {
  width: 100%;
  max-width: 320px;
  border: 1px solid rgba(238, 238, 238, 0.2);
  padding: 2.75rem 2.25rem;
  background: #141414;
}

.login__title {
  margin: 0 0 2rem;
  font-size: 0.72rem;
  font-weight: 400;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: #eeeeee;
}

.login__label {
  display: block;
  font-size: 0.62rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  margin: 1.15rem 0 0.45rem;
  color: #999999;
}

.login__label:first-of-type {
  margin-top: 0;
}

.login__error {
  margin: 1.25rem 0 0;
  font-size: 0.8rem;
  color: #cccccc;
}

.login__submit {
  margin-top: 2rem;
  width: 100%;
}
</style>
