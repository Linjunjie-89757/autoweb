<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { Hide, View } from '@element-plus/icons-vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'

import {
  aiProviderBrands,
  inferAiProviderBrand,
  type AiProviderBrand,
  type AiProviderConnectionItem,
} from '@/entities/ai-provider'
import AppButton from '@/shared/ui/app-button/AppButton.vue'
import AppDialog from '@/shared/ui/app-dialog/AppDialog.vue'

import {
  aiConnectionProtocolOptions,
  aiConnectionStatusOptions,
  buildSaveAiConnectionPayload,
  createAiConnectionFormFromItem,
  createDefaultAiConnectionForm,
  type AiConnectionDialogMode,
  type AiConnectionForm,
  validateAiConnectionForm,
} from './model'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    mode: AiConnectionDialogMode
    provider?: AiProviderConnectionItem | null
    saving?: boolean
    defaultWorkspaceCode?: string
  }>(),
  {
    provider: null,
    defaultWorkspaceCode: 'ALL',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: ReturnType<typeof buildSaveAiConnectionPayload>]
}>()

const form = reactive<AiConnectionForm>(createDefaultAiConnectionForm(props.defaultWorkspaceCode))
const formError = ref('')
const apiKeyVisible = ref(false)
const dialogStep = ref<'provider' | 'config'>('provider')
const selectedBrand = ref<AiProviderBrand>(aiProviderBrands[0])

function resetForm() {
  const nextForm =
    props.mode === 'edit' && props.provider
      ? createAiConnectionFormFromItem(props.provider)
      : createDefaultAiConnectionForm(props.defaultWorkspaceCode)

  Object.assign(form, nextForm)
  formError.value = ''
  apiKeyVisible.value = false

  if (props.mode === 'edit' && props.provider) {
    selectedBrand.value = inferAiProviderBrand(props.provider)
    dialogStep.value = 'config'
  } else {
    selectedBrand.value = aiProviderBrands[0]
    dialogStep.value = 'provider'
  }
}

function submit() {
  const error = validateAiConnectionForm(form, props.mode)
  if (error) {
    formError.value = error
    return
  }

  formError.value = ''
  emit('submit', buildSaveAiConnectionPayload(form, {
    includeApiKey: props.mode === 'create' || Boolean(form.apiKey.trim()),
  }))
}

function selectBrand(brand: AiProviderBrand) {
  selectedBrand.value = brand
  form.connectionName = `${brand.shortName} 连接`
  form.protocolType = brand.protocolType
  form.baseUrl = brand.baseUrl
  form.modelName = brand.models[0] ?? ''
  formError.value = ''
  dialogStep.value = 'config'
}

function backToProviderStep() {
  if (props.mode === 'create') {
    formError.value = ''
    dialogStep.value = 'provider'
  }
}

function restoreDefaultBaseUrl() {
  form.baseUrl = selectedBrand.value.baseUrl
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      resetForm()
    }
  },
)

watch(
  () => props.provider,
  () => {
    if (props.modelValue) {
      resetForm()
    }
  },
)
</script>

<template>
  <AppDialog
    :model-value="modelValue"
    :title="mode === 'create' && dialogStep === 'provider' ? '选择供应商' : mode === 'create' ? '配置连接' : '编辑 AI 连接'"
    width="min(672px, calc(100vw - 32px))"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="ai-connection-dialog">
      <section v-if="mode === 'create' && dialogStep === 'provider'" class="ai-connection-provider-step">
        <p>选择要接入的 AI 服务供应商，下一步会带入默认协议、地址和模型建议。</p>
        <div class="ai-connection-provider-grid">
          <button
            v-for="brand in aiProviderBrands"
            :key="brand.id"
            type="button"
            class="ai-connection-provider-card"
            @click="selectBrand(brand)"
          >
            <span
              class="ai-connection-brand"
              :class="[
                `ai-connection-brand--${brand.tone}`,
                brand.logoClass,
                { 'has-logo-image': brand.logoSrc },
              ]"
            >
              <img v-if="brand.logoSrc" :src="brand.logoSrc" :alt="brand.name">
              <span>{{ brand.shortName.slice(0, 1) }}</span>
            </span>
            <span>
              <strong>{{ brand.name }}</strong>
              <small>{{ brand.description }}</small>
            </span>
            <ChevronRight class="ai-connection-provider-card__arrow" :size="16" />
          </button>
        </div>
      </section>

      <section v-else class="ai-connection-config-step">
        <button
          v-if="mode === 'create'"
          type="button"
          class="ai-connection-dialog__back"
          @click="backToProviderStep"
        >
          <ChevronLeft :size="13" />
          重新选择供应商
        </button>

        <div class="ai-connection-selected-provider">
          <span
            class="ai-connection-brand"
            :class="[
              `ai-connection-brand--${selectedBrand.tone}`,
              selectedBrand.logoClass,
              { 'has-logo-image': selectedBrand.logoSrc },
            ]"
          >
            <img v-if="selectedBrand.logoSrc" :src="selectedBrand.logoSrc" :alt="selectedBrand.name">
            <span>{{ selectedBrand.shortName.slice(0, 1) }}</span>
          </span>
          <span>
            <strong>{{ selectedBrand.name }}</strong>
            <small>{{ selectedBrand.description }}</small>
          </span>
        </div>

        <label class="ai-connection-dialog__field">
          <span>连接名称</span>
          <el-input v-model="form.connectionName" placeholder="例如：OpenAI 官方 / DeepSeek 代理 / 内网网关" />
        </label>

        <div class="ai-connection-dialog__field">
          <span class="ai-connection-dialog__label-row">
            API URL
            <button type="button" @click="restoreDefaultBaseUrl">恢复默认</button>
          </span>
          <el-input v-model="form.baseUrl" class="is-mono" :placeholder="selectedBrand.baseUrl" />
          <small>支持自定义代理地址或私有部署地址</small>
        </div>

        <label class="ai-connection-dialog__field">
          <span>API Key {{ mode === 'create' ? '*' : '' }}</span>
          <el-input
            v-model="form.apiKey"
            class="is-mono"
            :type="apiKeyVisible ? 'text' : 'password'"
            autocomplete="current-password"
            :placeholder="mode === 'edit' ? '留空则继续使用已保存密钥' : '请输入 API Key'"
          >
            <template #suffix>
              <button
                type="button"
                class="ai-connection-dialog__password-toggle"
                :aria-label="apiKeyVisible ? '隐藏 API Key' : '显示 API Key'"
                @click="apiKeyVisible = !apiKeyVisible"
              >
                <el-icon>
                  <View v-if="!apiKeyVisible" />
                  <Hide v-else />
                </el-icon>
              </button>
            </template>
          </el-input>
        </label>

        <label class="ai-connection-dialog__field">
          <span>模型名称</span>
          <el-input v-model="form.modelName" class="is-mono" placeholder="例如：gpt-4o、deepseek-chat、qwen-max" />
        </label>

        <details class="ai-connection-dialog__advanced">
          <summary>高级配置</summary>
          <label class="ai-connection-dialog__field">
            <span>目标空间</span>
            <el-input v-model="form.workspaceCode" placeholder="ALL" />
          </label>

          <div class="ai-connection-dialog__field">
            <span>协议类型</span>
            <div class="ai-connection-dialog__segment">
              <button
                v-for="item in aiConnectionProtocolOptions"
                :key="item.value"
                type="button"
                :class="{ 'is-active': form.protocolType === item.value }"
                @click="form.protocolType = item.value"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <div class="ai-connection-dialog__grid">
            <label class="ai-connection-dialog__field">
              <span>请求超时（秒）</span>
              <el-input-number v-model="form.requestTimeoutSeconds" :min="10" :max="600" />
            </label>

            <div class="ai-connection-dialog__field">
              <span>状态</span>
              <div class="ai-connection-dialog__segment is-two">
                <button
                  v-for="item in aiConnectionStatusOptions"
                  :key="item.value"
                  type="button"
                  :class="{ 'is-active': form.status === item.value }"
                  @click="form.status = item.value"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>
          </div>
        </details>

        <p v-if="formError" class="ai-connection-dialog__error">{{ formError }}</p>
      </section>
    </div>

    <template #footer>
      <div class="ai-connection-dialog__footer">
        <span aria-hidden="true" />
        <div class="ai-connection-dialog__footer-actions">
          <AppButton :disabled="saving" @click="emit('update:modelValue', false)">取消</AppButton>
          <AppButton
            v-if="mode === 'create' && dialogStep === 'provider'"
            type="primary"
            @click="selectBrand(selectedBrand)"
          >
            下一步
          </AppButton>
          <AppButton v-else type="primary" :loading="saving" @click="submit">
            {{ mode === 'edit' ? '保存修改' : '添加连接' }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppDialog>
</template>

<style scoped>
.ai-connection-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ai-connection-provider-step,
.ai-connection-config-step {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 20px;
}

.ai-connection-provider-step > p {
  margin: 0 0 4px;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.ai-connection-provider-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ai-connection-provider-card {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 82px;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  color: #374151;
  cursor: pointer;
  text-align: left;
  transition: border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.ai-connection-provider-card:hover {
  border-color: #93c5fd;
  background: #f8fbff;
  box-shadow: 0 14px 34px rgba(37, 99, 235, 0.1);
  transform: translateY(-1px);
}

.ai-connection-provider-card > span:last-child,
.ai-connection-selected-provider > span:last-child {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.ai-connection-provider-card strong,
.ai-connection-selected-provider strong {
  overflow: hidden;
  color: #111827;
  font-size: 14px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-connection-provider-card small,
.ai-connection-selected-provider small {
  display: -webkit-box;
  overflow: hidden;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.ai-connection-provider-card__arrow {
  flex: 0 0 auto;
  margin-left: auto;
  color: #9ca3af;
  transition: color 180ms ease, transform 180ms ease;
}

.ai-connection-provider-card:hover .ai-connection-provider-card__arrow {
  color: #2563eb;
  transform: translateX(2px);
}

.ai-connection-selected-provider {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #f8fbff;
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.03);
}

.ai-connection-brand {
  position: relative;
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-bg-muted);
  color: var(--app-text-secondary);
  font-size: var(--app-font-size-sm);
  font-weight: 800;
  line-height: 1;
}

.ai-connection-brand img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.ai-connection-brand.has-logo-image {
  overflow: hidden;
  padding: 8px;
  background: #fff;
}

.ai-connection-brand.has-logo-image > span {
  display: none;
}

.ai-connection-brand--primary {
  border-color: #bfdbfe;
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.ai-connection-brand--success {
  border-color: #bbf7d0;
  background: var(--app-success-soft);
  color: var(--app-success);
}

.ai-connection-brand--warning {
  border-color: #fed7aa;
  background: var(--app-warning-soft);
  color: var(--app-warning);
}

.ai-connection-brand--danger {
  border-color: #fecaca;
  background: var(--app-danger-soft);
  color: var(--app-danger);
}

.ai-connection-brand--purple {
  border-color: #e9d5ff;
  background: var(--app-purple-soft);
  color: var(--app-purple);
}

.ai-connection-dialog__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  min-height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--app-primary);
  cursor: pointer;
  font-size: var(--app-font-size-xs);
  font-weight: 600;
}

.ai-connection-dialog__label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ai-connection-dialog__label-row button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
  font-size: 12px;
}

.ai-connection-dialog__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--app-space-4);
}

.ai-connection-dialog__field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.ai-connection-dialog__field > span {
  color: #374151;
  font-size: 14px;
  font-weight: 500;
}

.ai-connection-dialog__field small {
  color: #9ca3af;
  font-size: 12px;
  line-height: 1.4;
}

.ai-connection-dialog :deep(.el-input__wrapper) {
  min-height: 42px;
  border-radius: 12px;
  box-shadow: 0 0 0 1px #e5e7eb inset;
}

.ai-connection-dialog :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #60a5fa inset, 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.ai-connection-dialog :deep(.is-mono .el-input__inner) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.ai-connection-dialog__segment {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--app-space-2);
}

.ai-connection-dialog__segment.is-two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.ai-connection-dialog__segment button {
  min-height: var(--app-control-height-md);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  background: var(--app-bg-panel);
  color: var(--app-text-secondary);
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
}

.ai-connection-dialog__segment button:hover {
  background: var(--app-bg-page);
}

.ai-connection-dialog__segment button.is-active {
  border-color: var(--app-primary);
  background: var(--app-primary);
  color: var(--app-text-inverse);
}

.ai-connection-dialog__password-toggle {
  display: inline-flex;
  align-items: center;
  border: 0;
  background: transparent;
  color: var(--app-text-subtle);
  cursor: pointer;
}

.ai-connection-dialog__advanced {
  display: grid;
  gap: var(--app-space-4);
  padding: 12px;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  background: #fbfdff;
}

.ai-connection-dialog__advanced summary {
  color: #64748b;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
}

.ai-connection-dialog__advanced[open] summary {
  margin-bottom: var(--app-space-4);
}

.ai-connection-dialog__error {
  margin: 0;
  color: var(--app-danger);
  font-size: var(--app-font-size-sm);
}

.ai-connection-dialog__footer {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.ai-connection-dialog__footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .ai-connection-provider-card {
    transition: none;
  }

  .ai-connection-provider-card:hover {
    transform: none;
  }
}

@media (max-width: 720px) {
  .ai-connection-provider-grid,
  .ai-connection-dialog__grid,
  .ai-connection-dialog__segment {
    grid-template-columns: 1fr;
  }

  .ai-connection-provider-card {
    min-height: 88px;
  }
}
</style>
