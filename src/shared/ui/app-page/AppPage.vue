<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="app-page">
    <div class="app-page__content">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.app-page {
  display: flex;
  flex-direction: column;
}

.app-page__content {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-5);
}
</style>
