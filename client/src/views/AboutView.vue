<script setup>
import { onMounted } from "vue";

onMounted(() => {
  document.title = "About - Photo Gallery";
});
</script>

<template>
  <main class="about-view">
    <div class="content-wrapper">
      <h1 class="page-title">ABOUT</h1>
      <div class="about-content">
        <section class="about-section">
          <h2 class="section-title">The Story</h2>
          <p>
            This photography platform is a carefully curated collection of visual narratives,
            capturing moments across diverse subjects and settings. Each photograph represents
            a unique perspective and artistic vision.
          </p>
        </section>

        <section class="about-section">
          <h2 class="section-title">Vision</h2>
          <p>
            We believe in the power of imagery to communicate, inspire, and connect. Our mission
            is to showcase exceptional photography while providing a space for creative exploration
            and bibliographic reference.
          </p>
        </section>

        <section class="about-section">
          <h2 class="section-title">Collection</h2>
          <p>
            Navigate through our archive of photographs organized by theme and time. Discover
            street photography, gallery selections, and comprehensive bibliographic resources
            supporting visual research.
          </p>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.about-view {
  min-height: 100vh;
  background: #111111;
  padding: 6rem 5% 4rem;
}

.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 3.5rem;
  font-weight: 300;
  letter-spacing: 0.1em;
  color: #fff;
  margin-bottom: 3rem;
  text-transform: uppercase;
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.about-section {
  border-left: 2px solid #333;
  padding-left: 2rem;
}

.section-title {
  font-size: 1.3rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  color: #fff;
  margin-bottom: 1rem;
  text-transform: uppercase;
}

.about-section p {
  font-size: 0.95rem;
  color: #bbb;
  line-height: 1.8;
  margin: 0;
}

@media (max-width: 768px) {
  .about-view {
    padding: 4rem 5% 3rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .about-section {
    padding-left: 1.5rem;
  }
}
</style>
