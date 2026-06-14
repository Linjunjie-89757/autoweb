import { ref } from 'vue'

const STORAGE_KEY = 'app:selected-workspace-code'
const DEFAULT_WORKSPACE_CODE = 'ALL'

function readStoredWorkspaceCode() {
  if (typeof window === 'undefined') {
    return DEFAULT_WORKSPACE_CODE
  }

  return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_WORKSPACE_CODE
}

const selectedWorkspaceCode = ref(readStoredWorkspaceCode())

export function useWorkspaceContext() {
  function setSelectedWorkspaceCode(workspaceCode: string) {
    selectedWorkspaceCode.value = workspaceCode || DEFAULT_WORKSPACE_CODE

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, selectedWorkspaceCode.value)
    }
  }

  return {
    selectedWorkspaceCode,
    setSelectedWorkspaceCode,
  }
}
