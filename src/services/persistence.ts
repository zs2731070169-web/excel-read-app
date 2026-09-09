import type { WorkbookData } from './types'

/**
 * IndexedDB 持久化（design.md D4）：
 * db: excel-search / stores: workbook(单记录 key='current'), ui-state(单记录 key='current')
 * 数万行 × 4 字段超出 localStorage 5MB 上限风险 → IndexedDB 结构化克隆。
 * 所有写失败降级为「仅内存」由调用方处理（捕获后提示，不崩溃）。
 */
const DB_NAME = 'excel-search'
const DB_VERSION = 1
const STORE_WORKBOOK = 'workbook'
const STORE_UI = 'ui-state'
const KEY = 'current'

export interface UiState {
  activeSheetName: string | null
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_WORKBOOK)) db.createObjectStore(STORE_WORKBOOK)
      if (!db.objectStoreNames.contains(STORE_UI)) db.createObjectStore(STORE_UI)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB 打开失败'))
  })
}

function tx<T>(db: IDBDatabase, store: string, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode)
    const req = run(t.objectStore(store))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB 操作失败'))
  })
}

/** 保存工作簿（导入完成或重新导入时调用） */
export async function saveWorkbook(data: WorkbookData): Promise<void> {
  const db = await openDb()
  try {
    await tx(db, STORE_WORKBOOK, 'readwrite', (s) => s.put(data, KEY))
  } finally {
    db.close()
  }
}

/** 读取工作簿；无记录或库不可用返回 null */
export async function loadWorkbook(): Promise<WorkbookData | null> {
  try {
    const db = await openDb()
    try {
      return await tx<WorkbookData | undefined>(db, STORE_WORKBOOK, 'readonly', (s) => s.get(KEY)) ?? null
    } finally {
      db.close()
    }
  } catch {
    return null
  }
}

/** 保存 UI 状态（当前选中 Sheet 名） */
export async function saveUiState(state: UiState): Promise<void> {
  const db = await openDb()
  try {
    await tx(db, STORE_UI, 'readwrite', (s) => s.put(state, KEY))
  } finally {
    db.close()
  }
}

/** 读取 UI 状态；无记录返回默认值 */
export async function loadUiState(): Promise<UiState> {
  try {
    const db = await openDb()
    try {
      return (
        (await tx<UiState | undefined>(db, STORE_UI, 'readonly', (s) => s.get(KEY))) ?? {
          activeSheetName: null,
        }
      )
    } finally {
      db.close()
    }
  } catch {
    return { activeSheetName: null }
  }
}

/** 清空全部本地数据（清空导入数据功能）：一个连接内删两个 store */
export async function clearAll(): Promise<void> {
  const db = await openDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction([STORE_WORKBOOK, STORE_UI], 'readwrite')
      t.objectStore(STORE_WORKBOOK).delete(KEY)
      t.objectStore(STORE_UI).delete(KEY)
      t.oncomplete = () => resolve()
      t.onerror = () => reject(t.error ?? new Error('IndexedDB 清空失败'))
      t.onabort = () => reject(t.error ?? new Error('IndexedDB 清空中止'))
    })
  } finally {
    db.close()
  }
}
