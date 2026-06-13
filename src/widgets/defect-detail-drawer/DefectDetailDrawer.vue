<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import {
  DefectPriorityBadge,
  DefectSeverityBadge,
  DefectStatusBadge,
  defectApi,
  formatDefectDateTime,
  formatDefectTags,
  type DefectAttachment,
  type DefectComment,
  type DefectDetail,
} from '@/entities/defect'
import { getRequestErrorMessage } from '@/shared/api/error'
import AppButton from '@/shared/ui/app-button/AppButton.vue'
import AppDrawer from '@/shared/ui/app-drawer/AppDrawer.vue'
import AppEmptyState from '@/shared/ui/app-empty-state/AppEmptyState.vue'
import AppLoadingState from '@/shared/ui/app-loading-state/AppLoadingState.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    defectId?: number | null
    workspaceCode?: string
  }>(),
  {
    defectId: null,
    workspaceCode: 'ALL',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const detail = ref<DefectDetail | null>(null)
const comments = ref<DefectComment[]>([])
const loading = ref(false)
const errorMessage = ref('')
const commentsLoading = ref(false)
const commentsErrorMessage = ref('')
const activeTab = ref<'basic' | 'detail' | 'comment' | 'history'>('basic')
let detailRequestSeq = 0
let commentsRequestSeq = 0

const detailTabs = [
  { key: 'basic', label: '基础信息' },
  { key: 'detail', label: '详情' },
  { key: 'comment', label: '评论' },
  { key: 'history', label: '历史' },
] as const

const activityCount = computed(() => {
  if (!Array.isArray(detail.value?.activities)) {
    return 0
  }

  return detail.value.activities.length
})

function closeDrawer() {
  emit('update:modelValue', false)
}

function displayText(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  return String(value)
}

function formatFileSize(value: number | null | undefined) {
  if (!value || value <= 0) {
    return '-'
  }

  if (value < 1024) {
    return `${value} B`
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function getAttachments(value: DefectDetail | null): DefectAttachment[] {
  return Array.isArray(value?.attachments) ? value.attachments : []
}

async function loadDetail() {
  if (!props.defectId) {
    return
  }

  const requestSeq = ++detailRequestSeq
  loading.value = true
  errorMessage.value = ''
  detail.value = null
  try {
    const nextDetail = await defectApi.getDefectDetail(props.workspaceCode, props.defectId)
    if (requestSeq === detailRequestSeq) {
      detail.value = nextDetail
      comments.value = Array.isArray(nextDetail.comments) ? nextDetail.comments : comments.value
    }
  } catch (error) {
    if (requestSeq === detailRequestSeq) {
      errorMessage.value = getRequestErrorMessage(error)
    }
  } finally {
    if (requestSeq === detailRequestSeq) {
      loading.value = false
    }
  }
}

async function loadComments() {
  if (!props.defectId) {
    return
  }

  const requestSeq = ++commentsRequestSeq
  commentsLoading.value = true
  commentsErrorMessage.value = ''
  try {
    const nextComments = await defectApi.getDefectComments(props.workspaceCode, props.defectId)
    if (requestSeq === commentsRequestSeq) {
      comments.value = nextComments
    }
  } catch (error) {
    if (requestSeq === commentsRequestSeq) {
      commentsErrorMessage.value = getRequestErrorMessage(error)
    }
  } finally {
    if (requestSeq === commentsRequestSeq) {
      commentsLoading.value = false
    }
  }
}

watch(
  () => [props.modelValue, props.defectId, props.workspaceCode] as const,
  ([visible]) => {
    if (visible) {
      activeTab.value = 'basic'
      void loadDetail()
      void loadComments()
    }
  },
  { immediate: true },
)
</script>

<template>
  <AppDrawer
    :model-value="modelValue"
    :with-header="false"
    size="850px"
    drawer-class="defect-detail-drawer-host"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="defect-detail-drawer">
      <header class="defect-detail-drawer__topbar">
        <div class="defect-detail-drawer__title-wrap">
          <div class="defect-detail-drawer__object-line">
            <DefectPriorityBadge v-if="detail" :priority="detail.priority" />
            <span class="defect-detail-drawer__code">{{ displayText(detail?.bugNo) }}</span>
            <strong class="defect-detail-drawer__title">{{ displayText(detail?.title || '缺陷详情') }}</strong>
            <DefectStatusBadge v-if="detail" :status="detail.status" />
          </div>
          <p class="defect-detail-drawer__subtitle">
            {{ displayText(detail?.workspaceName || detail?.workspaceCode || detail?.sourceType || '缺陷详情') }}
          </p>
        </div>

        <button class="defect-detail-drawer__close" type="button" aria-label="关闭" @click="closeDrawer">×</button>
      </header>

      <nav v-if="detail" class="defect-detail-drawer__tabs" aria-label="缺陷详情分区">
        <button
          v-for="tab in detailTabs"
          :key="tab.key"
          type="button"
          class="defect-detail-drawer__tab"
          :class="{ 'is-active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>

      <div class="defect-detail-drawer__content">
        <AppLoadingState v-if="loading && !detail" text="正在加载缺陷详情..." />

        <AppEmptyState v-else-if="errorMessage && !detail" title="缺陷详情加载失败" :description="errorMessage">
          <template #actions>
            <AppButton @click="loadDetail">重试</AppButton>
          </template>
        </AppEmptyState>

        <template v-else-if="detail">
          <div v-if="errorMessage" class="defect-detail-drawer__inline-error">
            {{ errorMessage }}
            <AppButton size="small" @click="loadDetail">重试</AppButton>
          </div>

          <section v-show="activeTab === 'basic'" class="defect-detail-drawer__pane">
            <div class="defect-detail-drawer__section defect-detail-drawer__section--hero">
              <div class="defect-detail-drawer__section-header">
                <h4>基础信息</h4>
                <span>缺陷流转的核心字段</span>
              </div>
              <dl class="defect-detail-drawer__meta">
                <div>
                  <dt>所属空间</dt>
                  <dd>{{ displayText(detail.workspaceName || detail.workspaceCode) }}</dd>
                </div>
                <div>
                  <dt>处理人</dt>
                  <dd>{{ displayText(detail.assigneeName) }}</dd>
                </div>
                <div>
                  <dt>报告人</dt>
                  <dd>{{ displayText(detail.reporterName) }}</dd>
                </div>
                <div>
                  <dt>关联用例</dt>
                  <dd>{{ displayText(detail.relatedCaseId || detail.relatedCaseCount) }}</dd>
                </div>
                <div>
                  <dt>创建时间</dt>
                  <dd>{{ formatDefectDateTime(detail.createdAt) }}</dd>
                </div>
                <div>
                  <dt>更新时间</dt>
                  <dd>{{ formatDefectDateTime(detail.updatedAt) }}</dd>
                </div>
              </dl>
            </div>

            <div class="defect-detail-drawer__section">
              <div class="defect-detail-drawer__section-header">
                <h4>状态标签</h4>
                <span>状态、优先级、严重级别</span>
              </div>
              <div class="defect-detail-drawer__badges">
                <DefectStatusBadge :status="detail.status" />
                <DefectPriorityBadge :priority="detail.priority" />
                <DefectSeverityBadge :severity="detail.severity" />
              </div>
            </div>
          </section>

          <section v-show="activeTab === 'detail'" class="defect-detail-drawer__pane">
            <div class="defect-detail-drawer__section">
              <div class="defect-detail-drawer__section-header">
                <h4>标签</h4>
                <span>用于快速归类和筛选</span>
              </div>
              <p class="defect-detail-drawer__text is-compact">{{ formatDefectTags(detail.tags) }}</p>
            </div>

            <div class="defect-detail-drawer__section">
              <div class="defect-detail-drawer__section-header">
                <h4>缺陷描述</h4>
                <span>复现现象、影响范围和补充信息</span>
              </div>
              <p class="defect-detail-drawer__text">{{ displayText(detail.description) }}</p>
            </div>

            <div class="defect-detail-drawer__section">
              <div class="defect-detail-drawer__section-header">
                <h4>附件</h4>
                <span>{{ getAttachments(detail).length }} 个附件</span>
              </div>
              <div v-if="getAttachments(detail).length" class="defect-detail-drawer__list">
                <div
                  v-for="attachment in getAttachments(detail)"
                  :key="attachment.id"
                  class="defect-detail-drawer__list-item"
                >
                  <strong>{{ displayText(attachment.fileName) }}</strong>
                  <span>
                    {{ formatFileSize(attachment.fileSize) }}
                    · {{ displayText(attachment.uploadedByName) }}
                    · {{ formatDefectDateTime(attachment.createdAt) }}
                  </span>
                </div>
              </div>
              <p v-else class="defect-detail-drawer__muted">暂无附件</p>
            </div>
          </section>

          <section v-show="activeTab === 'comment'" class="defect-detail-drawer__pane">
            <div class="defect-detail-drawer__section">
              <div class="defect-detail-drawer__section-header">
                <h4>评论</h4>
                <span>{{ comments.length }} 条评论</span>
              </div>
              <AppLoadingState v-if="commentsLoading && !comments.length" text="正在加载评论..." />

              <div v-else-if="commentsErrorMessage && !comments.length" class="defect-detail-drawer__inline-error">
                <span>{{ commentsErrorMessage }}</span>
                <AppButton size="small" @click="loadComments">重试</AppButton>
              </div>

              <div v-else-if="comments.length" class="defect-detail-drawer__list">
                <div v-for="comment in comments" :key="comment.id" class="defect-detail-drawer__list-item">
                  <strong>{{ displayText(comment.commenterName) }}</strong>
                  <p>{{ displayText(comment.content) }}</p>
                  <span>{{ formatDefectDateTime(comment.createdAt) }}</span>
                </div>
              </div>

              <p v-else class="defect-detail-drawer__muted">暂无评论</p>
            </div>
          </section>

          <section v-show="activeTab === 'history'" class="defect-detail-drawer__pane">
            <div class="defect-detail-drawer__section">
              <div class="defect-detail-drawer__section-header">
                <h4>历史</h4>
                <span>{{ activityCount }} 条记录</span>
              </div>
              <p class="defect-detail-drawer__muted">当前阶段仅保留历史入口，待后续按后端活动数据做只读时间线。</p>
            </div>
          </section>
        </template>
      </div>
    </div>
  </AppDrawer>
</template>

<style scoped>
.defect-detail-drawer {
  display: flex;
  height: 100%;
  flex-direction: column;
  min-height: 0;
  background: var(--app-bg-panel);
}

:global(.defect-detail-drawer-host .el-drawer__body) {
  min-height: 0;
  padding: 0;
}

.defect-detail-drawer__topbar {
  display: flex;
  min-width: 0;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-4);
  min-height: 72px;
  padding: var(--app-space-5) var(--app-space-6) var(--app-space-3);
  border-bottom: 1px solid var(--app-border);
  background: var(--app-bg-panel);
}

.defect-detail-drawer__title-wrap {
  min-width: 0;
  flex: 1;
}

.defect-detail-drawer__object-line {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--app-space-2);
  white-space: nowrap;
}

.defect-detail-drawer__code {
  flex: 0 0 auto;
  color: var(--app-primary);
  font-size: var(--app-font-size-sm);
  font-weight: 600;
  line-height: var(--app-line-height-sm);
}

.defect-detail-drawer__title {
  min-width: 0;
  overflow: hidden;
  color: var(--app-text-primary);
  font-size: var(--app-font-size-lg);
  font-weight: 600;
  line-height: var(--app-line-height-lg);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.defect-detail-drawer__subtitle {
  margin: var(--app-space-1) 0 0;
  color: var(--app-text-muted);
  font-size: var(--app-font-size-xs);
  line-height: var(--app-line-height-xs);
}

.defect-detail-drawer__close {
  display: inline-flex;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--app-radius-sm);
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  transition: background-color 160ms ease, color 160ms ease;
}

.defect-detail-drawer__close:hover,
.defect-detail-drawer__close:focus-visible {
  background: var(--app-primary-soft);
  color: var(--app-primary);
  outline: none;
}

.defect-detail-drawer__tabs {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--app-space-5);
  min-height: 44px;
  padding: 0 var(--app-space-6);
  border-bottom: 1px solid var(--app-border);
  background: var(--app-bg-panel);
}

.defect-detail-drawer__tab {
  position: relative;
  height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--app-text-muted);
  cursor: pointer;
  font-size: var(--app-font-size-sm);
  font-weight: 500;
  line-height: 44px;
  white-space: nowrap;
  transition: color 160ms ease;
}

.defect-detail-drawer__tab:hover,
.defect-detail-drawer__tab:focus-visible {
  color: var(--app-primary);
  outline: none;
}

.defect-detail-drawer__tab.is-active {
  color: var(--app-primary);
  font-weight: 600;
}

.defect-detail-drawer__tab.is-active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  border-radius: 999px 999px 0 0;
  background: var(--app-primary);
  content: '';
}

.defect-detail-drawer__content {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: var(--app-space-5) var(--app-space-6);
  background: var(--app-bg-panel);
}

.defect-detail-drawer__pane {
  display: grid;
  gap: var(--app-space-5);
}

.defect-detail-drawer__badges {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--app-space-2);
}

.defect-detail-drawer__section {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-3);
  padding: var(--app-space-4);
  border: 1px solid var(--app-border-soft);
  border-radius: var(--app-radius-lg);
  background: var(--app-bg-subtle);
}

.defect-detail-drawer__section--hero {
  background: var(--app-bg-panel);
}

.defect-detail-drawer__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
}

.defect-detail-drawer__section-header h4 {
  margin: 0;
  color: var(--app-text-primary);
  font-size: var(--app-font-size-sm);
  font-weight: 700;
}

.defect-detail-drawer__section-header span {
  color: var(--app-text-subtle);
  font-size: var(--app-font-size-xs);
  line-height: var(--app-line-height-xs);
}

.defect-detail-drawer__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--app-space-3);
  margin: 0;
}

.defect-detail-drawer__meta div {
  min-width: 0;
}

.defect-detail-drawer__meta dt {
  margin-bottom: var(--app-space-1);
  color: var(--app-text-subtle);
  font-size: var(--app-font-size-xs);
}

.defect-detail-drawer__meta dd {
  margin: 0;
  color: var(--app-text-main);
  font-size: var(--app-font-size-sm);
  line-height: 22px;
  overflow-wrap: anywhere;
}

.defect-detail-drawer__text {
  margin: 0;
  max-height: 340px;
  overflow: auto;
  padding: var(--app-space-3);
  border: 1px solid var(--app-border-soft);
  border-radius: var(--app-radius-md);
  background: var(--app-bg-panel);
  color: var(--app-text-main);
  font-size: var(--app-font-size-sm);
  line-height: 22px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.defect-detail-drawer__text.is-compact {
  max-height: 120px;
}

.defect-detail-drawer__list {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--app-space-2);
}

.defect-detail-drawer__list-item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--app-space-1);
  padding: var(--app-space-3);
  border: 1px solid var(--app-border-soft);
  border-radius: var(--app-radius-md);
  background: var(--app-bg-panel);
}

.defect-detail-drawer__list-item strong {
  min-width: 0;
  color: var(--app-text-primary);
  font-size: var(--app-font-size-sm);
  overflow-wrap: anywhere;
}

.defect-detail-drawer__list-item p {
  margin: 0;
  color: var(--app-text-main);
  font-size: var(--app-font-size-sm);
  line-height: 22px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.defect-detail-drawer__list-item span,
.defect-detail-drawer__muted {
  color: var(--app-text-muted);
  font-size: var(--app-font-size-xs);
  line-height: var(--app-line-height-xs);
  overflow-wrap: anywhere;
}

.defect-detail-drawer__muted {
  margin: 0;
  padding: var(--app-space-4);
  border: 1px dashed var(--app-border);
  border-radius: var(--app-radius-md);
  background: var(--app-bg-panel);
  text-align: center;
}

.defect-detail-drawer__inline-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
  padding: var(--app-space-2) var(--app-space-3);
  border: 1px solid #fecaca;
  border-radius: var(--app-radius-md);
  background: var(--app-danger-soft);
  color: var(--app-danger);
  font-size: var(--app-font-size-sm);
}

@media (max-width: 720px) {
  .defect-detail-drawer__topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .defect-detail-drawer__close {
    position: absolute;
    top: var(--app-space-3);
    right: var(--app-space-3);
  }

  .defect-detail-drawer__tabs {
    gap: var(--app-space-4);
    overflow-x: auto;
  }

  .defect-detail-drawer__badges {
    justify-content: flex-start;
  }

  .defect-detail-drawer__meta {
    grid-template-columns: 1fr;
  }
}
</style>
