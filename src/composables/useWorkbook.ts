import { computed, reactive, readonly } from 'vue'
import type { SheetResult, WorkbookData } from '../services/types'

/**
 * 工作簿会话状态（design.md D1：会话层，由 useLibrary.openFile 注入）。
 * 搜索状态机（方案B显式触发/过期清空）与旧版完全一致，仅数据来源改为注入式。
 */
export type SearchPhase = 'idle' | 'has-result' | 'empty-result'

interface WorkbookSessionState {
  /** 当前会话的工作簿（null = 无会话，文件库页） */
  workbook: WorkbookData | null
  /** 当前选中 Sheet 名 */
  activeSheetName: string | null
  /** 搜索 */
  keyword: string
  searchPhase: SearchPhase
  /** 搜索结果（searchPhase 为 idle 时为空数组，展示走 browseRows） */
  results: OrderRow[]
}

import type { OrderRow } from '../services/types'

/** 会话源状态（测试直接断言用）；组件层用 useWorkbook() 返回的 readonly 视图 */
export const state = reactive<WorkbookSessionState>({
  workbook: null,
  activeSheetName: null,
  keyword: '',
  searchPhase: 'idle',
  results: [],
})

/** 会话回调：切门店时通知宿主（持久化记忆） */
let onSheetChangeCallback: ((sheetName: string | null) => void) | null = null

/**
 * 打开工作簿会话（useLibrary.openFile 调用）。
 * @param initialSheetName 恢复的上次门店（无则调用方已回退到第一个）
 */
export function openWorkbookSession(
  workbook: WorkbookData,
  initialSheetName: string | null,
  callbacks: { onSheetChange?: (sheetName: string | null) => void } = {},
): void {
  state.workbook = workbook
  // 防御：传入的门店名不存在（如重导后 Sheet 改名）时回退第一个
  const sheetNames = workbook.sheets.map((s) => s.name)
  state.activeSheetName =
    initialSheetName && sheetNames.includes(initialSheetName)
      ? initialSheetName
      : (sheetNames[0] ?? null)
  onSheetChangeCallback = callbacks.onSheetChange ?? null
  resetSearchState()
  state.keyword = ''
}

/** 结束会话（回文件库） */
export function resetWorkbookSession(): void {
  state.workbook = null
  state.activeSheetName = null
  state.keyword = ''
  state.searchPhase = 'idle'
  state.results = []
  onSheetChangeCallback = null
}

/** 切换 Sheet（sheet-switch spec: 切换后清空结果、保留关键词） */
export function switchSheet(name: string): void {
  if (state.activeSheetName === name) return
  state.activeSheetName = name
  resetSearchState() // 只清结果回未搜索态，关键词保留
  onSheetChangeCallback?.(name)
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

/** 关键词变更（order-search spec: 结果过期清空，关键词保留） */
export function setKeyword(kw: string): void {
  state.keyword = kw
  resetSearchState()
}

/** 清空搜索回到初始态（× 按钮） */
export function resetSearch(): void {
  state.keyword = ''
  resetSearchState()
}

function resetSearchState(): void {
  state.results = []
  state.searchPhase = 'idle'
}

export const activeSheet = computed<SheetResult | null>(() => {
  if (!state.workbook || !state.activeSheetName) return null
  return state.workbook.sheets.find((s) => s.name === state.activeSheetName) ?? null
})

/** 浏览模式展示行（order-search spec: 未搜索时展示当前门店全部记录，按 Excel 行序） */
export const browseRows = computed<OrderRow[]>(() => {
  const sheet = activeSheet.value
  if (!sheet || !sheet.valid) return []
  return sheet.rows
})

export const sheetNames = computed<string[]>(
  () => state.workbook?.sheets.map((s) => s.name) ?? [],
)

export function useWorkbook() {
  return {
    state: readonly(state),
    activeSheet,
    browseRows,
    sheetNames,
    switchSheet,
    search,
    setKeyword,
    resetSearch,
  }
}
