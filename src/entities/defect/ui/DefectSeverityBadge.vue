<script setup lang="ts">
import { computed } from 'vue'

import { getDefectSeverityMeta } from '../lib/format'

const props = defineProps<{
  severity: string
}>()

const meta = computed(() => getDefectSeverityMeta(props.severity))
</script>

<template>
  <span class="defect-badge" :class="`defect-badge--${meta.tone}`">
    {{ meta.label }}
  </span>
</template>

<style scoped>
.defect-badge {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  justify-content: center;
  min-height: 20px;
  padding: 2px 8px;
  border: 0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  white-space: nowrap;
}

.defect-badge--critical {
  background: #fee2e2;
  color: #b91c1c;
}

.defect-badge--high {
  background: #fef9c3;
  color: #a16207;
}

.defect-badge--medium,
.defect-badge--low,
.defect-badge--neutral {
  background: #f3f4f6;
  color: #374151;
}
</style>
