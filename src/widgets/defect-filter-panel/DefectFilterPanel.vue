<script setup lang="ts">
import { nextTick, reactive, watch } from 'vue'
import { Plus, RefreshRight, Search } from '@element-plus/icons-vue'

import {
  defectPriorityOptions,
  defectSeverityOptions,
  defectStatusOptions,
  type DefectClientFilter,
} from '@/entities/defect'
import AppButton from '@/shared/ui/app-button/AppButton.vue'

const props = defineProps<{
  modelValue: DefectClientFilter
  showCreateButton?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DefectClientFilter]
  reset: []
  create: []
}>()

const form = reactive<DefectClientFilter>({
  keyword: props.modelValue.keyword,
  status: props.modelValue.status,
  priority: props.modelValue.priority,
  severity: props.modelValue.severity,
})
let syncingFromModel = false

function isSameFilter(left: DefectClientFilter, right: DefectClientFilter) {
  return (
    left.keyword === right.keyword &&
    left.status === right.status &&
    left.priority === right.priority &&
    left.severity === right.severity
  )
}

watch(
  () => props.modelValue,
  (value) => {
    if (!isSameFilter(form, value)) {
      syncingFromModel = true
      Object.assign(form, value)
      void nextTick(() => {
        syncingFromModel = false
      })
    }
  },
  { deep: true },
)

watch(
  form,
  () => {
    if (syncingFromModel) {
      return
    }

    const nextFilter = { ...form }
    if (!isSameFilter(nextFilter, props.modelValue)) {
      emit('update:modelValue', nextFilter)
    }
  },
  { deep: true },
)

function resetFilters() {
  emit('reset')
}
</script>

<template>
  <section class="defect-filter-panel">
    <div class="defect-filter-panel__left">
      <el-input
        v-model="form.keyword"
        class="defect-filter-panel__search"
        clearable
        placeholder="搜索编号 / 标题 / 处理人"
        :prefix-icon="Search"
      />
      <el-select v-model="form.status" class="defect-filter-panel__control" clearable placeholder="状态">
        <el-option v-for="item in defectStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="form.priority" class="defect-filter-panel__control" clearable placeholder="优先级">
        <el-option v-for="item in defectPriorityOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-select v-model="form.severity" class="defect-filter-panel__control" clearable placeholder="严重级别">
        <el-option v-for="item in defectSeverityOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </div>

    <div class="defect-filter-panel__right">
      <AppButton :icon="RefreshRight" @click="resetFilters">重置</AppButton>
      <AppButton v-if="showCreateButton" type="primary" :icon="Plus" @click="$emit('create')">新增缺陷</AppButton>
    </div>
  </section>
</template>

<style scoped>
.defect-filter-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-4);
  padding: var(--app-space-4) var(--app-space-5);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  background: var(--app-bg-panel);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.defect-filter-panel__left,
.defect-filter-panel__right {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
}

.defect-filter-panel__left {
  min-width: 0;
  flex: 1 1 auto;
  flex-wrap: wrap;
}

.defect-filter-panel__right {
  flex: 0 0 auto;
  margin-left: auto;
}

.defect-filter-panel__search {
  width: min(248px, 100%);
}

.defect-filter-panel__control {
  width: 132px;
}

.defect-filter-panel :deep(.el-input__wrapper),
.defect-filter-panel :deep(.el-select__wrapper) {
  min-height: 36px;
  border-radius: var(--app-radius-md);
  box-shadow: 0 0 0 1px var(--app-border-strong) inset;
}

.defect-filter-panel :deep(.el-input__wrapper:hover),
.defect-filter-panel :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--app-border-strong) inset;
}

.defect-filter-panel :deep(.el-input__prefix) {
  color: var(--app-text-subtle);
}

@media (max-width: 960px) {
  .defect-filter-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .defect-filter-panel__right {
    margin-left: 0;
    justify-content: flex-end;
  }
}

@media (max-width: 720px) {
  .defect-filter-panel__left,
  .defect-filter-panel__right,
  .defect-filter-panel__search,
  .defect-filter-panel__control {
    width: 100%;
  }

  .defect-filter-panel__right {
    justify-content: stretch;
    flex-wrap: wrap;
  }
}
</style>
