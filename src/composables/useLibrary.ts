import { reactive, readonly } from 'vue'
import type { WorkerMessage } from '../services/excelWorker'
import {
  deleteFile,
  fileIdentity,
  getFile,
  listFiles,
  putFile,
  type LibraryFile,
} from '../services/persistence'
import type { WorkbookData } from '../services/types'
import { openWorkbookSession, resetWorkbookSession } from './useWorkbook'

/**
 * 文件库全局状态（design.md D1：useLibrary 全局层 + useWorkbook 会话层）。
 * view 两态：library（文件库首页）/ workbook（某文件的工作簿页）。
 */
export type LibraryView = 'library' | 'workbook'
export type ImportPhase = 'idle' | 'parsing' | 'error'

interface LibraryState {
  view: LibraryView
  files: LibraryFile[]
  importPhase: ImportPhase
  importError: string | null
  /** 当前打开的文件 id（view=workbook 时有值） */
  activeFileId: string | null
  /** 启动恢复完成（避免首帧空列表闪烁） */
  restored: boolean
}

/** 可变源状态（测试直接断言用）；组件层用 useLibrary() 返回的 readonly 视图 */
export const state = reactive<LibraryState>({
  view: 'library',
  files: [],
  importPhase: 'idle',
  importError: null,
  activeFileId: null,
  restored: false,
})

/** Worker 引用与请求代际（清空/重导时使旧响应失效） */
let worker: Worker | null = null
let requestGeneration = 0
/** 当前请求的文件字节数（onParsed 计算 id 用——fileIdentity 依赖真实大小） */
let pendingFileSize = 0

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../services/excelWorker.ts', import.meta.url), {
      type: 'module',
    })
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data
      if (msg.id !== requestGeneration) return // 过期响应
      if (msg.type === 'done') {
        void onParsed(msg.data, pendingFileSize)
      } else if (msg.type === 'error') {
        state.importPhase = 'error'
        state.importError = msg.message
      }
    }
    worker.onerror = () => {
      if (state.importPhase === 'parsing') {
        state.importPhase = 'error'
        state.importError = '文件解析失败，请检查文件是否损坏'
      }
    }
  }
  return worker
}

/** 解析完成：入库（同名覆盖）并自动打开 */
async function onParsed(workbook: WorkbookData, fileSize: number): Promise<void> {
  const id = fileIdentity(workbook.fileName, fileSize)
  const existing = await getFile(id)
  const now = Date.now()
  await putFile({
    id,
    fileName: workbook.fileName,
    // 覆盖保留首次导入时间（列表位置不动），新文件用当前时间
    firstImportedAt: existing?.firstImportedAt ?? now,
    importedAt: now,
    // 覆盖保留上次门店记忆
    lastSheetName: existing?.lastSheetName ?? null,
    workbook,
  })
  state.importPhase = 'idle'
  state.importError = null
  await refreshFiles()
  await openFile(id)
}

/** 刷新文件列表（导入/删除后调用） */
async function refreshFiles(): Promise<void> {
  state.files = await listFiles()
}

/** 导入新文件（来自 excelPicker 的选取结果） */
export async function importFile(fileName: string, arrayBuffer: ArrayBuffer): Promise<void> {
  state.importPhase = 'parsing'
  state.importError = null
  requestGeneration += 1
  const id = requestGeneration
  pendingFileSize = arrayBuffer.byteLength
  getWorker().postMessage({ id, arrayBuffer, fileName }, [arrayBuffer])
}

/** 启动恢复：读文件库，落在文件库页（spec: 重启恢复到文件库） */
export async function restoreLibrary(): Promise<void> {
  await refreshFiles()
  state.view = 'library'
  state.activeFileId = null
  state.restored = true
}

/** 进入某文件的工作簿页 */
export async function openFile(id: string): Promise<void> {
  const record = await getFile(id)
  if (!record) return
  state.activeFileId = id
  state.view = 'workbook'
  // 会话注入：选中该文件上次门店（无记忆则第一个）
  const sheetNames = record.workbook.sheets.map((s) => s.name)
  const lastSheet =
    record.lastSheetName && sheetNames.includes(record.lastSheetName)
      ? record.lastSheetName
      : (sheetNames[0] ?? null)
  openWorkbookSession(record.workbook, lastSheet, {
    onSheetChange: (sheetName) => {
      void updateSheetMemory(id, sheetName)
    },
  })
}

/** 工作簿会话内切门店 → 持久化记忆（fire-and-forget） */
async function updateSheetMemory(id: string, sheetName: string | null): Promise<void> {
  try {
    const record = await getFile(id)
    if (record && record.lastSheetName !== sheetName) {
      record.lastSheetName = sheetName
      await putFile(record)
    }
  } catch {
    /* 记忆失败不打断使用 */
  }
}

/** 返回文件库页 */
export function closeWorkbook(): void {
  state.view = 'library'
  state.activeFileId = null
  resetWorkbookSession()
}

/** 删除文件；若删的是当前打开的，先回文件库 */
export async function deleteLibraryFile(id: string): Promise<void> {
  if (state.activeFileId === id) closeWorkbook()
  await deleteFile(id)
  await refreshFiles()
}

export function useLibrary() {
  return {
    state: readonly(state),
    importFile,
    restoreLibrary,
    openFile,
    closeWorkbook,
    deleteLibraryFile,
  }
}
