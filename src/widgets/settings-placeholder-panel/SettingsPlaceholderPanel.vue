<script setup lang="ts">
import AppEmptyState from '@/shared/ui/app-empty-state/AppEmptyState.vue'

withDefaults(
  defineProps<{
    title: string
    description?: string
  }>(),
  {
    description: '该分类会在后续目标中按真实接口逐步接入，当前先保留统一占位态。',
  },
)
</script>

<template>
  <section class="settings-placeholder-panel">
    <AppEmptyState :title="title" :description="description" />
  </section>
</template>

<style scoped>
.settings-placeholder-panel {
  display: flex;
  min-height: 100%;
  min-width: 0;
  align-items: center;
  justify-content: center;
  padding: 28px 32px;
}

.settings-placeholder-panel :deep(.app-empty-state) {
  width: min(520px, 100%);
  min-height: 260px;
  padding: var(--app-space-8);
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--app-bg-panel) 0%, var(--app-bg-subtle) 100%);
  box-shadow: 0 10px 30px rgb(15 23 42 / 6%);
}

.settings-placeholder-panel :deep(.app-empty-state__icon) {
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

@media (max-width: 640px) {
  .settings-placeholder-panel {
    padding: var(--app-space-4);
  }
}
</style>
