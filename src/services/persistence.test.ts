import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { parseWorkbook } from './excelParser'
import {
  clearFiles,
  deleteFile,
  fileIdentity,
  getFile,
  listFiles,
  putFile,
  type LibraryFile,
} from './persistence'
import type { WorkbookData } from './types'

function makeWorkbook(name = '订单.xlsx', sheetNames = ['沿河店']): WorkbookData {
  const wb = XLSX.utils.book_new()
  for (const sheet of sheetNames) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ['商品名称', '条形码', '货架号', '价格'],
        ['可乐', '6901', 'A1', '3'],
      ]),
      sheet,
    )
  }
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  return parseWorkbook(buf, name)
}

function makeRecord(fileName: string, firstImportedAt: number): LibraryFile {
  return {
    id: fileIdentity(fileName, 1000),
    fileName,
    firstImportedAt,
    importedAt: firstImportedAt,
    lastSheetName: null,
    workbook: makeWorkbook(fileName),
  }
}

beforeEach(async () => {
  await clearFiles()
})

describe('文件 id 规则 (1.3)', () => {
  it('同名同大小 → 同 id（覆盖语义）', () => {
    expect(fileIdentity('订单.xlsx', 1024)).toBe(fileIdentity('订单.xlsx', 1024))
  })

  it('不同名或不同大小 → 不同 id', () => {
    expect(fileIdentity('订单.xlsx', 1024)).not.toBe(fileIdentity('订单2.xlsx', 1024))
    expect(fileIdentity('订单.xlsx', 1024)).not.toBe(fileIdentity('订单.xlsx', 2048))
  })
})

describe('files store CRUD (1.1)', () => {
  it('put 后 list/get 可读回', async () => {
    await putFile(makeRecord('订单.xlsx', 1000))
    const files = await listFiles()
    expect(files).toHaveLength(1)
    expect(files[0].fileName).toBe('订单.xlsx')
    expect(files[0].workbook.sheets[0].rows[0].name).toBe('可乐')
    expect((await getFile(files[0].id))?.id).toBe(files[0].id)
  })

  it('list 按 firstImportedAt 倒序（最新在上）', async () => {
    await putFile(makeRecord('旧文件.xlsx', 1000))
    await putFile(makeRecord('新文件.xlsx', 2000))
    const files = await listFiles()
    expect(files.map((f) => f.fileName)).toEqual(['新文件.xlsx', '旧文件.xlsx'])
  })

  it('同名覆盖：put 同 id 后仅一条，firstImportedAt 保留 importedAt 更新', async () => {
    await putFile(makeRecord('订单.xlsx', 1000))
    const updated = makeRecord('订单.xlsx', 1000)
    updated.importedAt = 9999
    await putFile(updated)
    const files = await listFiles()
    expect(files).toHaveLength(1)
    expect(files[0].importedAt).toBe(9999)
    expect(files[0].firstImportedAt).toBe(1000)
  })

  it('deleteFile 删除指定记录', async () => {
    await putFile(makeRecord('a.xlsx', 1000))
    await putFile(makeRecord('b.xlsx', 2000))
    const files = await listFiles()
    await deleteFile(files[0].id)
    expect((await listFiles()).map((f) => f.fileName)).toEqual(['a.xlsx'])
  })

})

describe('v1→v2 迁移 (1.2)', () => {
  /** 重建 v1 库：先删库（清掉 beforeEach 建立的 v2），再以 version 1 建旧结构 */
  async function seedV1(seed?: { workbook: WorkbookData }) {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('excel-search')
      req.onsuccess = req.onerror = req.onblocked = () => resolve()
    })
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('excel-search', 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('workbook')) db.createObjectStore('workbook')
        if (!db.objectStoreNames.contains('ui-state')) db.createObjectStore('ui-state')
      }
      req.onsuccess = () => {
        const db = req.result
        if (!seed) {
          db.close()
          resolve()
          return
        }
        const t = db.transaction(['workbook', 'ui-state'], 'readwrite')
        t.objectStore('workbook').put(seed.workbook, 'current')
        t.objectStore('ui-state').put({ activeSheetName: seed.workbook.sheets[0]?.name }, 'current')
        t.oncomplete = () => {
          db.close()
          resolve()
        }
        t.onerror = () => reject(t.error)
      }
      req.onerror = () => reject(req.error)
    })
  }

  it('旧单工作簿记录自动迁移为 files 一条', async () => {
    await seedV1({ workbook: makeWorkbook('旧订单.xlsx', ['江店1']) })

    // 触发 v2 打开 → 迁移
    const files = await listFiles()
    expect(files).toHaveLength(1)
    expect(files[0].fileName).toBe('旧订单.xlsx')
    expect(files[0].workbook.sheets[0].name).toBe('江店1')

    // 旧 store 已删除
    const dbCheck = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('excel-search')
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => reject(r.error)
    })
    expect(dbCheck.objectStoreNames.contains('workbook')).toBe(false)
    expect(dbCheck.objectStoreNames.contains('ui-state')).toBe(false)
    expect(dbCheck.objectStoreNames.contains('files')).toBe(true)
    dbCheck.close()
  })

  it('空 v1（无记录）→ 空库不报错', async () => {
    await seedV1()
    expect(await listFiles()).toEqual([])
  })
})
