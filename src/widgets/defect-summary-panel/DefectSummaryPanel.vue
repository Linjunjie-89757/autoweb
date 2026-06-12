<script setup lang="ts">
import { computed } from 'vue'
import { RefreshRight } from '@element-plus/icons-vue'

import type { DefectStatistics } from '@/entities/defect'
import AppButton from '@/shared/ui/app-button/AppButton.vue'

type DefectSummaryCard = {
  label: string
  value: number
  description: string
  tone: 'primary' | 'assigned' | 'processing' | 'verify' | 'success'
}

const props = defineProps<{
  statistics: DefectStatistics | null
  loading?: boolean
  errorMessage?: string
}>()

defineEmits<{
  retry: []
}>()

const stats = computed<DefectSummaryCard[]>(() => {
  const source = props.statistics ?? {
    total: 0,
    todo: 0,
    assigned: 0,
    inProgress: 0,
    pendingVerify: 0,
    closed: 0,
    rejected: 0,
  }

  return [
    { label: '缺陷总数', value: source.total, description: '全部缺陷', tone: 'primary' },
    { label: '待处理', value: source.todo, description: '待指派和待跟进', tone: 'assigned' },
    { label: '处理中', value: source.inProgress, description: '正在修复中', tone: 'processing' },
    { label: '待验证', value: source.pendingVerify, description: '等待验证结果', tone: 'verify' },
    { label: '已关闭', value: source.closed, description: '已确认解决', tone: 'success' },
  ]
})
</script>

<template>
  <div class="defect-summary-panel">
    <article
      v-for="stat in stats"
      :key="stat.label"
      class="defect-summary-panel__card"
      :class="`defect-summary-panel__card--${stat.tone}`"
    >
      <div class="defect-summary-panel__card-head">
        <span>{{ stat.label }}</span>
        <i class="defect-summary-panel__dot" aria-hidden="true" />
      </div>
      <strong>{{ stat.value }}</strong>
      <p>{{ stat.description }}</p>
    </article>

    <div v-if="errorMessage" class="defect-summary-panel__error">
      <span>{{ errorMessage }}</span>
      <AppButton size="small" :icon="RefreshRight" :disabled="loading" @click="$emit('retry')">重试</AppButton>
    </div>
  </div>
</template>

<style scoped>
.defect-summary-panel {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--app-space-4);
}

.defect-summary-panel__card {
  display: grid;
  gap: var(--app-space-2);
  min-height: 120px;
  padding: var(--app-space-4) var(--app-space-5);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  background: var(--app-bg-panel);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.defect-summary-panel__card:hover {
  border-color: var(--app-border-strong);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.defect-summary-panel__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
}

.defect-summary-panel__card-head span {
  color: var(--app-text-secondary);
  font-size: var(--app-font-size-sm);
  font-weight: 600;
  line-height: var(--app-line-height-sm);
}

.defect-summary-panel__card strong {
  color: var(--app-text-primary);
  font-size: 28px;
  line-height: 32px;
}

.defect-summary-panel__card p {
  margin: 0;
  color: var(--app-text-muted);
  font-size: var(--app-font-size-xs);
  line-height: 18px;
}

.defect-summary-panel__dot {
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  border-radius: 999px;
  background: #3b82f6;
  box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.12);
}

.defect-summary-panel__card--primary {
  border-color: #dbeafe;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.defect-summary-panel__card--assigned .defect-summary-panel__dot {
  background: #a855f7;
  box-shadow: 0 0 0 6px rgba(168, 85, 247, 0.12);
}

.defect-summary-panel__card--processing .defect-summary-panel__dot {
  background: #22c55e;
  box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.12);
}

.defect-summary-panel__card--verify .defect-summary-panel__dot {
  background: #f97316;
  box-shadow: 0 0 0 6px rgba(249, 115, 22, 0.12);
}

.defect-summary-panel__card--success .defect-summary-panel__dot {
  background: #16a34a;
  box-shadow: 0 0 0 6px rgba(22, 163, 74, 0.12);
}

.defect-summary-panel__error {
  display: flex;
  min-height: 120px;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
  padding: var(--app-space-4) var(--app-space-5);
  border: 1px solid #fecaca;
  border-radius: var(--app-radius-lg);
  background: var(--app-danger-soft);
  color: var(--app-danger);
  font-size: var(--app-font-size-sm);
}

.defect-summary-panel__error span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1180px) {
  .defect-summary-panel {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .defect-summary-panel {
    grid-template-columns: 1fr;
  }
}
</style>
