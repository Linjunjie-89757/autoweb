<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { caseApi, type CaseSummaryItem } from '@/entities/case'
import {
  defectApi,
  defectPriorityOptions,
  defectSeverityOptions,
  type DefectDetail,
} from '@/entities/defect'
import { userApi, type UserItem } from '@/entities/user'
import { workspaceApi, type WorkspaceItem } from '@/entities/workspace'
import { getRequestErrorMessage } from '@/shared/api/error'
import AppButton from '@/shared/ui/app-button/AppButton.vue'
import AppLoadingState from '@/shared/ui/app-loading-state/AppLoadingState.vue'
import {
  buildSaveDefectPayload,
  createDefaultDefectForm,
  createDefectFormFromDetail,
  type DefectForm,
  validateDefectForm,
} from '@/features/defect-create-edit/model'

const route = useRoute()
const router = useRouter()

const form = reactive<DefectForm>(createDefaultDefectForm())
const detail = ref<DefectDetail | null>(null)
const users = ref<UserItem[]>([])
const workspaces = ref<WorkspaceItem[]>([])
const caseOptions = ref<CaseSummaryItem[]>([])
const loading = ref(false)
const saving = ref(false)
const optionsLoading = ref(false)
const caseOptionsLoading = ref(false)
const errorMessage = ref('')
const formError = ref('')
const optionErrorMessage = ref('')

const defectId = computed(() => {
  const rawId = route.params.id
  const id = Array.isArray(rawId) ? Number(rawId[0]) : Number(rawId)
  return Number.isFinite(id) ? id : null
})

const routeWorkspaceCode = computed(() => {
  const rawWorkspace = route.query.workspace
  const workspaceCode = Array.isArray(rawWorkspace) ? rawWorkspace[0] : rawWorkspace
  return workspaceCode || 'ALL'
})

const workspaceName = computed(() => {
  const matched = workspaces.value.find(item => item.workspaceCode === form.workspaceCode)
  return matched?.workspaceName || detail.value?.workspaceName || form.workspaceCode || '-'
})

function getUserLabel(user: UserItem) {
  return user.displayName || user.username || `用户 ${user.id}`
}

function getCaseLabel(item: CaseSummaryItem) {
  const caseNo = item.caseNo || `#${item.id}`
  return item.title ? `${caseNo} / ${item.title}` : caseNo
}

function getConcreteWorkspaces() {
  return workspaces.value.filter(item => item.workspaceCode && item.workspaceCode !== 'ALL' && !item.allScope)
}

function getWorkspaceLabel(item: WorkspaceItem) {
  return item.workspaceName || item.workspaceCode
}

async function loadOptions() {
  optionsLoading.value = true
  optionErrorMessage.value = ''
  try {
    const [userList, workspaceList] = await Promise.all([
      userApi.getUsers(),
      workspaceApi.getSwitchableWorkspaces(),
    ])
    users.value = userList
    workspaces.value = workspaceList
  } catch (error) {
    optionErrorMessage.value = getRequestErrorMessage(error)
  } finally {
    optionsLoading.value = false
  }
}

async function loadCaseOptions(workspaceCode: string) {
  if (!workspaceCode || workspaceCode === 'ALL') {
    caseOptions.value = []
    return
  }

  caseOptionsLoading.value = true
  try {
    const page = await caseApi.getCases(workspaceCode, {
      pageNo: 1,
      pageSize: 50,
    })
    caseOptions.value = Array.isArray(page.items) ? page.items : []
  } catch {
    caseOptions.value = []
  } finally {
    caseOptionsLoading.value = false
  }
}

async function loadDefectDetail() {
  if (!defectId.value) {
    errorMessage.value = '缺陷不存在或链接参数无效。'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const nextDetail = await defectApi.getDefectDetail(routeWorkspaceCode.value, defectId.value)
    detail.value = nextDetail
    Object.assign(form, createDefectFormFromDetail(nextDetail))
    await loadCaseOptions(nextDetail.workspaceCode)
  } catch (error) {
    errorMessage.value = getRequestErrorMessage(error)
  } finally {
    loading.value = false
  }
}

function goBack() {
  const workspaceCode = detail.value?.workspaceCode || routeWorkspaceCode.value
  void router.push({
    path: '/bugs',
    query: workspaceCode ? { workspace: workspaceCode } : undefined,
  })
}

async function submit() {
  const error = validateDefectForm(form)
  if (error) {
    formError.value = error
    return
  }
  if (!defectId.value) {
    formError.value = '缺陷不存在或链接参数无效。'
    return
  }

  formError.value = ''
  saving.value = true
  try {
    const workspaceCode = detail.value?.workspaceCode || form.workspaceCode || routeWorkspaceCode.value
    await defectApi.updateDefect(workspaceCode, defectId.value, buildSaveDefectPayload(form))
    ElMessage.success('缺陷更新成功')
    goBack()
  } catch (requestError) {
    formError.value = getRequestErrorMessage(requestError)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void (async () => {
    await Promise.all([loadOptions(), loadDefectDetail()])
  })()
})
</script>

<template>
  <section class="defect-edit-page">
    <div class="defect-edit-page__shell">
      <header class="defect-edit-page__header">
        <div class="defect-edit-page__backbar">
          <el-button text :icon="ArrowLeft" class="defect-edit-page__back-button" @click="goBack">
            返回缺陷管理
          </el-button>
        </div>
        <div class="defect-edit-page__titlebar">
          <div>
            <h1>编辑缺陷</h1>
            <p>
              <span>{{ detail?.bugNo || '-' }}</span>
              <span>{{ workspaceName }}</span>
            </p>
          </div>
        </div>
      </header>

      <main class="defect-edit-page__content">
        <AppLoadingState v-if="loading" title="正在加载缺陷详情" description="请稍候，系统正在读取最新缺陷信息。" />
        <div v-else-if="errorMessage" class="defect-edit-page__error">
          <span>{{ errorMessage }}</span>
          <AppButton size="small" @click="loadDefectDetail">重试</AppButton>
        </div>

        <div v-else class="defect-edit-page__form-surface">
          <section class="defect-edit-page__main">
            <div class="defect-edit-page__section-header">
              <h2>主要信息</h2>
              <span>填写缺陷标题和现象描述，保存时沿用当前后端字段契约。</span>
            </div>

            <label class="defect-edit-page__field">
              <span class="is-required">缺陷标题</span>
              <el-input v-model="form.title" maxlength="255" placeholder="请输入缺陷标题" />
            </label>

            <label class="defect-edit-page__field">
              <span class="is-required">缺陷描述</span>
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="16"
                resize="none"
                placeholder="请输入复现现象、影响范围或必要上下文"
              />
            </label>
          </section>

          <aside class="defect-edit-page__side">
            <div class="defect-edit-page__section-header">
              <h2>流转字段</h2>
              <span>保持当前缺陷保存契约，只调整页面式编辑体验。</span>
            </div>

            <label class="defect-edit-page__field">
              <span class="is-required">工作空间</span>
              <el-select
                v-model="form.workspaceCode"
                class="defect-edit-page__select"
                disabled
                filterable
                placeholder="请选择工作空间"
              >
                <el-option
                  v-for="workspace in getConcreteWorkspaces()"
                  :key="workspace.workspaceCode"
                  :label="getWorkspaceLabel(workspace)"
                  :value="workspace.workspaceCode"
                />
              </el-select>
            </label>

            <label class="defect-edit-page__field">
              <span class="is-required">处理人</span>
              <el-select
                v-model="form.assigneeId"
                class="defect-edit-page__select"
                :loading="optionsLoading"
                filterable
                placeholder="请选择处理人"
              >
                <el-option
                  v-for="user in users"
                  :key="user.id"
                  :label="getUserLabel(user)"
                  :value="String(user.id)"
                >
                  <div class="defect-edit-page__option">
                    <span>{{ getUserLabel(user) }}</span>
                    <small>{{ user.username }}</small>
                  </div>
                </el-option>
              </el-select>
            </label>

            <div class="defect-edit-page__field">
              <span class="is-required">优先级</span>
              <div class="defect-edit-page__priority">
                <button
                  v-for="item in defectPriorityOptions"
                  :key="item.value"
                  type="button"
                  :class="{ 'is-active': form.priority === item.value }"
                  @click="form.priority = item.value"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>

            <label class="defect-edit-page__field">
              <span class="is-required">严重级别</span>
              <el-select v-model="form.severity" class="defect-edit-page__select">
                <el-option
                  v-for="item in defectSeverityOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </label>

            <label class="defect-edit-page__field">
              <span>关联用例</span>
              <el-select
                v-model="form.relatedCaseId"
                class="defect-edit-page__select"
                :loading="caseOptionsLoading"
                clearable
                filterable
                placeholder="可选"
              >
                <el-option
                  v-for="item in caseOptions"
                  :key="item.id"
                  :label="getCaseLabel(item)"
                  :value="String(item.id)"
                >
                  <div class="defect-edit-page__option">
                    <span>{{ item.title || '-' }}</span>
                    <small>{{ item.caseNo || `#${item.id}` }}</small>
                  </div>
                </el-option>
              </el-select>
            </label>

            <label class="defect-edit-page__field">
              <span>标签</span>
              <el-input v-model="form.tagsText" placeholder="多个标签用逗号或换行分隔" />
            </label>

            <p v-if="optionErrorMessage" class="defect-edit-page__inline-error">{{ optionErrorMessage }}</p>
          </aside>
        </div>

        <p v-if="formError" class="defect-edit-page__inline-error">{{ formError }}</p>
      </main>

      <footer class="defect-edit-page__footer">
        <AppButton :disabled="saving" @click="goBack">取消</AppButton>
        <AppButton type="primary" :loading="saving" :disabled="loading || Boolean(errorMessage)" @click="submit">
          保存
        </AppButton>
      </footer>
    </div>
  </section>
</template>

<style scoped>
.defect-edit-page {
  display: flex;
  min-height: 0;
  height: 100%;
  padding: var(--app-space-6);
  background: var(--app-bg-page);
}

.defect-edit-page__shell {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) 64px;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-lg);
  background: var(--app-bg-panel);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.defect-edit-page__header {
  display: grid;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-bg-panel);
}

.defect-edit-page__backbar {
  display: flex;
  align-items: center;
  padding: var(--app-space-4) var(--app-space-6) 0;
}

.defect-edit-page__back-button {
  padding: 0;
  color: var(--app-primary);
  font-size: 13px;
  font-weight: 600;
}

.defect-edit-page__titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-4);
  padding: var(--app-space-4) var(--app-space-6) var(--app-space-5);
}

.defect-edit-page__titlebar h1 {
  margin: 0;
  color: var(--app-text-primary);
  font-size: var(--app-font-size-lg);
  font-weight: 600;
  line-height: var(--app-line-height-lg);
}

.defect-edit-page__titlebar p {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-2);
  margin: var(--app-space-1) 0 0;
  color: var(--app-text-muted);
  font-size: var(--app-font-size-xs);
  line-height: var(--app-line-height-xs);
}

.defect-edit-page__content {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: var(--app-space-4);
  overflow: auto;
  padding: var(--app-space-5) var(--app-space-6);
}

.defect-edit-page__form-surface {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--app-border-soft);
  border-radius: var(--app-radius-lg);
  background: var(--app-bg-panel);
}

.defect-edit-page__main,
.defect-edit-page__side {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--app-space-4);
  padding: var(--app-space-5);
}

.defect-edit-page__side {
  border-left: 1px solid var(--app-border-soft);
  background: var(--app-bg-subtle);
}

.defect-edit-page__section-header {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-1);
  padding-bottom: var(--app-space-3);
  border-bottom: 1px solid var(--app-border-soft);
}

.defect-edit-page__section-header h2 {
  margin: 0;
  color: var(--app-text-primary);
  font-size: var(--app-font-size-sm);
  font-weight: 700;
  line-height: var(--app-line-height-sm);
}

.defect-edit-page__section-header span {
  color: var(--app-text-subtle);
  font-size: var(--app-font-size-xs);
  line-height: var(--app-line-height-xs);
}

.defect-edit-page__field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--app-space-2);
}

.defect-edit-page__field > span {
  color: var(--app-text-secondary);
  font-size: var(--app-font-size-sm);
  font-weight: 600;
  line-height: var(--app-line-height-sm);
}

.defect-edit-page__field > span.is-required::before {
  margin-right: 3px;
  color: var(--app-danger);
  content: '*';
}

.defect-edit-page__field :deep(.el-input__wrapper),
.defect-edit-page__field :deep(.el-textarea__inner),
.defect-edit-page__field :deep(.el-select__wrapper) {
  border-radius: var(--app-radius-md);
  box-shadow: 0 0 0 1px var(--app-border-strong) inset;
}

.defect-edit-page__field :deep(.el-textarea__inner) {
  min-height: 288px;
  padding: 12px 14px;
  color: var(--app-text-main);
  font-size: var(--app-font-size-sm);
  line-height: 1.75;
}

.defect-edit-page__select {
  width: 100%;
}

.defect-edit-page__priority {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--app-space-2);
}

.defect-edit-page__priority button {
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  background: var(--app-bg-panel);
  color: var(--app-text-secondary);
  cursor: pointer;
  font-size: var(--app-font-size-sm);
  font-weight: 600;
}

.defect-edit-page__priority button:hover,
.defect-edit-page__priority button.is-active {
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.defect-edit-page__option {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
}

.defect-edit-page__option span {
  overflow: hidden;
  color: var(--app-text-primary);
  font-size: var(--app-font-size-sm);
  font-weight: 500;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.defect-edit-page__option small {
  overflow: hidden;
  color: var(--app-text-muted);
  font-size: var(--app-font-size-xs);
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.defect-edit-page__error,
.defect-edit-page__inline-error {
  padding: 10px 12px;
  border: 1px solid #fecaca;
  border-radius: var(--app-radius-md);
  background: var(--app-danger-soft);
  color: var(--app-danger);
  font-size: var(--app-font-size-sm);
  line-height: var(--app-line-height-sm);
}

.defect-edit-page__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
}

.defect-edit-page__inline-error {
  margin: 0;
}

.defect-edit-page__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--app-space-3);
  padding: var(--app-space-3) var(--app-space-6);
  border-top: 1px solid var(--app-border);
  background: var(--app-bg-panel);
}

.defect-edit-page__footer :deep(.app-button) {
  min-width: 88px;
  height: 36px;
}

@media (max-width: 1080px) {
  .defect-edit-page__form-surface {
    grid-template-columns: 1fr;
  }

  .defect-edit-page__side {
    border-top: 1px solid var(--app-border-soft);
    border-left: 0;
  }
}

@media (max-width: 720px) {
  .defect-edit-page {
    padding: var(--app-space-3);
  }

  .defect-edit-page__content,
  .defect-edit-page__titlebar,
  .defect-edit-page__footer {
    padding-right: var(--app-space-4);
    padding-left: var(--app-space-4);
  }
}
</style>
