import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { parseWorkbook } from '../services/excelParser'
import { clearAll } from '../services/persistence'
import type { WorkbookData } from '../services/types'
import {
  clearImportedData,
  resetSearch,
  search,
  setKeyword,
  state,
  switchSheet,
} from './useWorkbook'

/** 直接注入 WorkbookData 到状态（绕过 Worker —— Worker 在 node 测试环境不可用，逻辑等价） */
function injectWorkbook(data: WorkbookData) {
  Object.assign(state, {
    phase: 'done',
    importError: null,
    workbook: data,
    activeSheetName: data.sheets[0]?.name ?? null,
    keyword: '',
    searchPhase: 'idle',
    results: [],
    persistenceDegraded: false,
  })
}

function makeWorkbook(): WorkbookData {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['商品名称', '条形码', '货架号', '价格'],
      ['可乐330ml', '6901234000011', 'A-12', '3.5'],
      ['可口可乐500ml', '6901234000028', 'A-13', '5'],
      ['雪碧', '6901234000035', 'B-01', '3'],
      ['Cola Mini', '6901234000042', 'A-121', '2.5'],
    ]),
    '沿河店',
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['商品名称', '条形码', '货架号', '价格'],
      ['可乐600ml', '6901234000059', 'C-01', '4'],
    ]),
    '江店1',
  )
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
  return parseWorkbook(buf, '订单.xlsx')
}

beforeEach(async () => {
  await clearAll()
  resetSearch()
  injectWorkbook(makeWorkbook())
})

describe('搜索匹配规则 (order-search spec)', () => {
  it('按商品名称包含匹配', () => {
    setKeyword('可乐')
    search()
    expect(state.results.map((r) => r.name)).toEqual(['可乐330ml', '可口可乐500ml'])
    expect(state.searchPhase).toBe('has-result')
  })

  it('按货架号匹配（包含关系）', () => {
    setKeyword('A-12')
    search()
    expect(state.results.map((r) => r.name)).toEqual(['可乐330ml', 'Cola Mini']) // A-12 与 A-121
  })

  it('大小写不敏感', () => {
    setKeyword('cola')
    search()
    expect(state.results.map((r) => r.name)).toEqual(['Cola Mini'])
  })

  it('仅当前工作表范围（江店1 的可乐600ml 不出现）', () => {
    setKeyword('600ml')
    search()
    expect(state.results).toEqual([]) // 沿河店无 600ml
    expect(state.searchPhase).toBe('empty-result')
  })

  it('空关键词不执行', () => {
    setKeyword('   ')
    search()
    expect(state.searchPhase).toBe('idle')
    expect(state.results).toEqual([])
  })

  it('无匹配 → empty-result', () => {
    setKeyword('不存在的商品')
    search()
    expect(state.searchPhase).toBe('empty-result')
  })
})

describe('结果过期清空 (order-search spec)', () => {
  it('关键词变更后清空旧结果（保留关键词）', () => {
    setKeyword('可乐')
    search()
    expect(state.searchPhase).toBe('has-result')
    setKeyword('雪碧') // 改词未搜索
    expect(state.searchPhase).toBe('idle')
    expect(state.results).toEqual([])
    expect(state.keyword).toBe('雪碧') // 关键词保留
  })

  it('切换工作表后清空（关键词保留）', () => {
    setKeyword('可乐')
    search()
    switchSheet('江店1')
    expect(state.searchPhase).toBe('idle')
    expect(state.results).toEqual([])
    expect(state.keyword).toBe('可乐') // sheet-switch spec: 关键词保留
    expect(state.activeSheetName).toBe('江店1')
  })

  it('切页后搜索范围随之切换', () => {
    switchSheet('江店1')
    setKeyword('600ml')
    search()
    expect(state.results.map((r) => r.name)).toEqual(['可乐600ml'])
  })
})

describe('清空导入数据 (excel-import spec)', () => {
  it('清空后回到未导入初始态', async () => {
    setKeyword('可乐')
    search()
    await clearImportedData()
    expect(state.workbook).toBeNull()
    expect(state.phase).toBe('idle')
    expect(state.activeSheetName).toBeNull()
    expect(state.keyword).toBe('')
    expect(state.searchPhase).toBe('idle')
    expect(state.results).toEqual([])
  })
})

describe('格式不符工作表 (excel-import spec)', () => {
  it('invalid Sheet 可选中但搜索为空', () => {
    state.workbook!.sheets.push({
      name: '坏表',
      valid: false,
      missingColumns: ['条形码'],
      rows: [],
    })
    switchSheet('坏表')
    setKeyword('可乐')
    search()
    expect(state.searchPhase).toBe('empty-result')
    expect(state.results).toEqual([])
  })
})
