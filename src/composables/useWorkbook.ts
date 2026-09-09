import { computed, reactive, readonly } from 'vue'
import type { WorkerMessage } from '../services/excelWorker'
import {
  clearAll,
  loadUiState,
  loadWorkbook,
  saveUiState,
  saveWorkbook,
} from '../services/persistence'
import type { OrderRow, SheetResult, WorkbookData } from '../services/types'

/**
 * 工作簿全局状态（design.md D1：单页应用，reactive 组合式状态，不引 Pinia）。
 * 持有唯一 Worker 实例，管理 导入/恢复/清空/切页/搜索 全部状态机。
 */
export type ImportPhase = 'idle' | 'parsing' | 'done' | 'error'
export type SearchPhase = 'idle' | 'has-result' | 'empty-result'

interface WorkbookState {
  /** 导入状态机 */
  phase: ImportPhase
  importError: string | null
  /** 已导入的工作簿（null = 未导入） */
  workbook: WorkbookData | null
  /** 当前选中 Sheet 名 */
  activeSheetName: string | null
  /** 搜索 */
  keyword: string
  searchPhase: SearchPhase
  results: OrderRow[]
  /** 持久化降级标记（IndexedDB 写失败 → 仅内存，提示用户重启丢失） */
  persistenceDegraded: boolean
  /** 启动恢复完成（避免首帧闪烁） */
  restored: boolean
}

/** 可变源状态（测试直接注入用）；组件层请用 useWorkbook() 返回的 readonly 视图 */
export const state = reactive<WorkbookState>({
  phase: 'idle',
  importError: null,
  workbook: null,
  activeSheetName: null,
  keyword: '',
  searchPhase: 'idle',
  results: [],
  persistenceDegraded: false,
  restored: false,
})

let worker: Worker | null = null
let requestId = 0
/** 清空/重导时使旧 Worker 响应失效 */
let currentRequest = 0

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../services/excelWorker.ts', import.meta.url), {
      type: 'module',
    })
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data
      if (msg.id !== currentRequest) return // 过期响应（已被清空/重导取代）
      if (msg.type === 'done') {
        applyWorkbookData(msg.data)
      } else if (msg.type === 'error') {
        state.phase = 'error'
        state.importError = msg.message
      }
      // progress: 单 Sheet 毫秒级，UI 用 phase=parsing 的 loading 态即可，不单独渲染
    }
    worker.onerror = () => {
      if (state.phase === 'parsing') {
        state.phase = 'error'
        state.importError = '文件解析失败，请检查文件是否损坏'
      }
    }
  }
  return worker
}

/** 解析完成：更新全部派生状态并持久化 */
function applyWorkbookData(data: WorkbookData): void {
  state.workbook = data
  state.phase = 'done'
  state.importError = null
  // 自动选中第一个 Sheet（sheet-switch spec: 导入成功后自动选中第一个）
  state.activeSheetName = data.sheets[0]?.name ?? null
  resetSearch()
  void persist(data)
}

async function persist(data: WorkbookData): Promise<void> {
  try {
    await saveWorkbook(data)
    await saveUiState({ activeSheetName: state.activeSheetName })
  } catch {
    state.persistenceDegraded = true
  }
}

/** 导入文件（file 来自 <input type=file>） */
export async function importFile(file: File): Promise<void> {
  state.phase = 'parsing'
  state.importError = null
  const id = ++requestId
  currentRequest = id
  const arrayBuffer = await file.arrayBuffer()
  getWorker().postMessage({ id, arrayBuffer, fileName: file.name }, [arrayBuffer])
}

/** 启动恢复（main.ts 调用一次） */
export async function restore(): Promise<void> {
  const [data, ui] = await Promise.all([loadWorkbook(), loadUiState()])
  if (data) {
    state.workbook = data
    state.phase = 'done'
    // 恢复上次选中 Sheet；若已被删除（重导后名称变化）回退第一个
    const names = data.sheets.map((s) => s.name)
    state.activeSheetName =
      ui.activeSheetName && names.includes(ui.activeSheetName)
        ? ui.activeSheetName
        : (data.sheets[0]?.name ?? null)
  }
  state.restored = true
}

/** 清空导入数据（excel-import spec: 确认弹窗后调用） */
export async function clearImportedData(): Promise<void> {
  currentRequest = ++requestId // 使飞行中的解析响应失效
  try {
    await clearAll()
    state.persistenceDegraded = false
  } catch {
    // 本地清空失败也复位内存态（下次导入会覆盖写）
  }
  state.workbook = null
  state.phase = 'idle'
  state.importError = null
  state.activeSheetName = null
  resetSearch()
}

/** 切换 Sheet（sheet-switch spec: 切换后清空结果、保留关键词） */
export function switchSheet(name: string): void {
  if (state.activeSheetName === name) return
  state.activeSheetName = name
  resetSearchState() // 只清结果回未搜索态，关键词保留（spec 明确）
  void saveUiState({ activeSheetName: name }).catch(() => {
    state.persistenceDegraded = true
  })
}

/** 搜索（order-search spec: 仅按钮/IME 触发调用） */
export function search(): void {
  const kw = state.keyword.trim()
  if (kw === '') return // 空关键词由 UI 层拦截提示，此处静默
  const sheet = activeSheet.value
  if (!sheet || !sheet.valid) {
    state.results = []
    state.searchPhase = 'empty-result'
    return
  }
  const lower = kw.toLowerCase()
  state.results = sheet.rows.filter(
    (r) => r.name.toLowerCase().includes(lower) || r.shelf.toLowerCase().includes(lower),
  )
  state.searchPhase = state.results.length > 0 ? 'has-result' : 'empty-result'
}

/** 关键词变更（order-search spec: 结果过期清空） */
export function setKeyword(kw: string): void {
  state.keyword = kw
  resetSearchState()
}

/** 清空搜索回到初始态（× 按钮 / 清空数据） */
export function resetSearch(): void {
  state.keyword = ''
  state.results = []
  state.searchPhase = 'idle'
}

function resetSearchState(): void {
  // 关键词变化 → 回未搜索态，但保留关键词本身（sheet-switch spec: 切页保留关键词）
  state.results = []
  state.searchPhase = 'idle'
}

export const activeSheet = computed<SheetResult | null>(() => {
  if (!state.workbook || !state.activeSheetName) return null
  return state.workbook.sheets.find((s) => s.name === state.activeSheetName) ?? null
})

export const sheetNames = computed<string[]>(() => state.workbook?.sheets.map((s) => s.name) ?? [])

export function useWorkbook() {
  return {
    state: readonly(state),
    activeSheet,
    sheetNames,
    importFile,
    restore,
    clearImportedData,
    switchSheet,
    search,
    setKeyword,
    resetSearch,
  }
}
