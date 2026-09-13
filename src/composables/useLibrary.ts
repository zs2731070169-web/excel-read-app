import { showToast } from 'vant'
import { reactive, readonly } from 'vue'
import type { WorkerMessage } from '../services/excelWorker'
import { pickExcelFile } from '../services/excelPicker'
import {
  fileIdentity,
  getFile,
  listFiles,
  putFile,
} from '../services/persistence'
import type { WorkbookData } from '../services/types'
import { openWorkbookSession } from './useWorkbook'

/**
 * 文件库全局状态（design.md D1：useLibrary 全局层 + useWorkbook 会话层）。
 * view 两态：empty（无文件导入引导空态）/ workbook（数据列表页）。
 * 文件库页已移除（remove-library-and-selection）：导入与冷启动均直达工作簿页。
 */
export type LibraryView = 'empty' | 'workbook'
export type ImportPhase = 'idle' | 'parsing' | 'error'

interface LibraryState {
  view: LibraryView
  importPhase: ImportPhase
  importError: string | null
  /** 启动恢复完成（避免首帧空态闪烁） */
  restored: boolean
}

/** 可变源状态（测试直接断言用）；组件层用 useLibrary() 返回的 readonly 视图 */
export const state = reactive<LibraryState>({
  view: 'empty',
  importPhase: 'idle',
  importError: null,
  restored: false,
})

/** Worker 引用与请求代际（重导时使旧响应失效） */
let worker: Worker | null = null
let requestGeneration = 0
/** 当前请求的文件字节数（onParsed 计算 id 用——fileIdentity 依赖真实大小） */
let pendingFileSize = 0
/** 文件选择器唤起中标志（importPhase 只覆盖解析阶段，选取期间靠它防重复唤起） */
let picking = false

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

/**
 * 解析完成：入库（同名覆盖）→ 直达该文件的工作簿页
 * （excel-import spec：导入成功 MUST NOT 停留在中间页面）。
 */
async function onParsed(workbook: WorkbookData, fileSize: number): Promise<void> {
  const id = fileIdentity(workbook.fileName, fileSize)
  const existing = await getFile(id)
  const now = Date.now()
  await putFile({
    id,
    fileName: workbook.fileName,
    // 覆盖保留首次导入时间（历史导入序），新文件用当前时间；
    // 重启直达目标按 importedAt（最近一次导入）判定，见 restoreLibrary
    firstImportedAt: existing?.firstImportedAt ?? now,
    importedAt: now,
    // 覆盖保留上次门店记忆
    lastSheetName: existing?.lastSheetName ?? null,
    workbook,
  })
  state.importPhase = 'idle'
  state.importError = null
  await openFile(id)
  // 成功反馈（excel-import spec：含工作表数量）；冷启动恢复不经此路径、无提示
  showToast(`已导入 ${workbook.sheets.length} 个工作表`)
}

/** 导入新文件（startImport 调用：来自 excelPicker 的选取结果） */
async function importFile(fileName: string, arrayBuffer: ArrayBuffer): Promise<void> {
  state.importPhase = 'parsing'
  state.importError = null
  requestGeneration += 1
  const id = requestGeneration
  pendingFileSize = arrayBuffer.byteLength
  getWorker().postMessage({ id, arrayBuffer, fileName }, [arrayBuffer])
}

/**
 * 统一导入入口（顶栏导入按钮与无文件空态共用，design D2）：
 * 选取 → Worker 解析 → 入库 → 直达工作簿页。
 * 错误双通道：选取/预校验异常就地 toast；Worker 解析错误异步置 importPhase='error'，
 * 由 App.vue 全局 notify 展示。
 */
export async function startImport(): Promise<void> {
  if (picking || state.importPhase === 'parsing') return // 选取/解析期间不可重复导入
  picking = true
  try {
    const picked = await pickExcelFile()
    if (!picked) return // 取消
    await importFile(picked.fileName, picked.arrayBuffer)
  } catch (err) {
    showToast(err instanceof Error ? err.message : '导入失败')
  } finally {
    picking = false
  }
}

/**
 * 启动恢复：直接进入最近导入文件的工作簿页（excel-import spec），
 * 本地无任何文件时落在导入引导空态。
 * 直达目标按 importedAt（最近一次导入）判定——覆盖重导会更新 importedAt，
 * 故「先导 A → 导 B → 重导 A」后重启仍直达 A。
 */
export async function restoreLibrary(): Promise<void> {
  const files = await listFiles() // firstImportedAt 倒序，需按 importedAt 重排
  const latest = [...files].sort((a, b) => b.importedAt - a.importedAt)[0]
  if (latest) {
    try {
      await openFile(latest.id)
    } catch (err) {
      // 单条记录读取失败（IndexedDB 异常/记录损坏）：降级空态保可用，
      // 用户仍可重新导入；不吞 restored 置位，否则 App 永久白屏
      console.error('启动恢复失败，降级为导入引导空态', err)
      state.view = 'empty'
    }
  } else {
    state.view = 'empty'
  }
  state.restored = true
}

/** 进入某文件的工作簿页（启动恢复与导入直达两个内部入口调用） */
async function openFile(id: string): Promise<void> {
  const record = await getFile(id)
  if (!record) return
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

export function useLibrary() {
  return {
    state: readonly(state),
    startImport,
  }
}
