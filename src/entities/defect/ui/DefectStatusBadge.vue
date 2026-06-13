<script setup lang="ts">
import { computed } from 'vue'

import { getDefectStatusMeta } from '../lib/format'

const props = defineProps<{
  status: string
}>()

const meta = computed(() => getDefectStatusMeta(props.status))
</script>

<template>
  <span class="defect-status-pill" :class="`defect-status-pill--${meta.tone}`">
    {{ meta.label }}
  </span>
</template>

<style scoped>
.defect-status-pill {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  padding: 2px 10px;
  border: 1px solid transparent;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  white-space: nowrap;
}

.defect-status-pill--assigned {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.defect-status-pill--processing {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.defect-status-pill--verify {
  border-color: #fed7aa;
  background: #fff7ed;
  color: #c2410c;
}

.defect-status-pill--success {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #047857;
}

.defect-status-pill--muted {
  border-color: #e2e8f0;
  background: #f8fafc;
  color: #64748b;
}

.defect-status-pill--neutral {
  border-color: #e2e8f0;
  background: #f1f5f9;
  color: #64748b;
}
</style>
