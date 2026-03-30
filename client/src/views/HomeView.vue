<script setup>
// Home page - placeholder for future content
</script>

<template>
  <div class="home">
    <div class="home__content">
      <h1 class="home__title">SENSHAN</h1>
      <p class="home__subtitle">Photography & Bibliography Archive</p>
      <p class="home__description">
        浏览相册，探索书籍收藏。
      </p>
    </div>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background: #111111;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 5%;
}

.home__content {
  text-align: center;
}

.home__title {
  font-size: 2.5rem;
  font-weight: 300;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #666;
  margin: 0 0 1rem 0;
}

.home__subtitle {
  font-size: 0.9rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #555;
  margin: 0 0 2rem 0;
}

.home__description {
  font-size: 0.85rem;
  color: #999;
  line-height: 1.6;
  max-width: 400px;
  margin: 0 auto;
}
</style>
