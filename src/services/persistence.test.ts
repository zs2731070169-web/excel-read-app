import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { parseWorkbook } from './excelParser'
import {
  clearAll,
  loadUiState,
  loadWorkbook,
  saveUiState,
  saveWorkbook,
} from './persistence'
import type { WorkbookData } from './types'

function makeWorkbook(sheetNames: string[]): WorkbookData {
  const wb = XLSX.utils.book_new()
  for (const name of sheetNames) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ['商品名称', '条形码', '货架号', '价格'],
        ['可乐', '6901', 'A1', '3'],
      ]),
      name,
    )
  }
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  return parseWorkbook(buf, '订单.xlsx')
}

beforeEach(async () => {
  await clearAll()
})

describe('persistence — 导入/恢复/覆盖 (3.2/3.3)', () => {
  it('保存后可完整读回（结构化克隆保真）', async () => {
    const data = makeWorkbook(['江店1', '沿河店'])
    await saveWorkbook(data)
    const loaded = await loadWorkbook()
    expect(loaded).not.toBeNull()
    expect(loaded!.fileName).toBe('订单.xlsx')
    expect(loaded!.sheets.map((s) => s.name)).toEqual(['江店1', '沿河店'])
    expect(loaded!.sheets[0].rows[0]).toEqual({ name: '可乐', barcode: '6901', shelf: 'A1', price: '3' })
  })

  it('重新导入同文件 → 新数据完全覆盖旧数据', async () => {
    await saveWorkbook(makeWorkbook(['旧门店']))
    await saveWorkbook(makeWorkbook(['新门店A', '新门店B']))
    const loaded = await loadWorkbook()
    expect(loaded!.sheets.map((s) => s.name)).toEqual(['新门店A', '新门店B'])
  })

  it('无数据时 loadWorkbook 返回 null', async () => {
    expect(await loadWorkbook()).toBeNull()
  })

  it('UiState 保存与恢复', async () => {
    await saveUiState({ activeSheetName: '沿河店' })
    expect(await loadUiState()).toEqual({ activeSheetName: '沿河店' })
  })

  it('UiState 无记录返回默认值', async () => {
    expect(await loadUiState()).toEqual({ activeSheetName: null })
  })

  it('clearAll 同时清两个 store', async () => {
    await saveWorkbook(makeWorkbook(['门店']))
    await saveUiState({ activeSheetName: '门店' })
    await clearAll()
    expect(await loadWorkbook()).toBeNull()
    expect(await loadUiState()).toEqual({ activeSheetName: null })
  })
})
