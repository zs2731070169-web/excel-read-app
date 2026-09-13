import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { parseWorkbook } from '../services/excelParser'
import { clearFiles } from '../services/persistence'
import type { WorkbookData } from '../services/types'
import {
  openWorkbookSession,
  resetWorkbookSession,
  search,
  setKeyword,
  state,
  switchSheet,
} from './useWorkbook'

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

beforeEach(() => {
  resetWorkbookSession()
  openWorkbookSession(makeWorkbook(), null) // 注入即重置搜索态（keyword=''/idle）
  void clearFiles()
})

describe('会话注入 (3.2)', () => {
  it('初始选中第一个 sheet', () => {
    expect(state.activeSheetName).toBe('沿河店')
  })

  it('恢复上次门店（initialSheetName）', () => {
    openWorkbookSession(makeWorkbook(), '江店1')
    expect(state.activeSheetName).toBe('江店1')
  })

  it('lastSheetName 不存在时回退第一个', () => {
    openWorkbookSession(makeWorkbook(), '不存在的门店')
    expect(state.activeSheetName).toBe('沿河店')
  })
})

describe('搜索匹配规则 (order-search spec, 回归保持)', () => {
  it('按商品名称包含匹配', () => {
    setKeyword('可乐')
    search()
    expect(state.results.map((r) => r.name)).toEqual(['可乐330ml', '可口可乐500ml'])
    expect(state.searchPhase).toBe('has-result')
  })

  it('按货架号匹配（包含关系）', () => {
    setKeyword('A-12')
    search()
    expect(state.results.map((r) => r.name)).toEqual(['可乐330ml', 'Cola Mini'])
  })

  it('关键词命中显示截断部分仍能搜到（省略仅显示层，匹配基于数据层完整名称）', () => {
    // 超长名称：前段超出列宽被 CSS 省略号截断，尾段「第999号限定款」仅存在于数据层
    state.workbook!.sheets[0].rows.push({
      name: '【超长品牌名称】爆款促销装草莓香味组合第999号限定款',
      barcode: '6901234000097',
      shelf: 'D-99',
      price: '99',
    })
    setKeyword('第999号限定款')
    search()
    expect(state.results.map((r) => r.name)).toEqual([
      '【超长品牌名称】爆款促销装草莓香味组合第999号限定款',
    ])
  })

  it('大小写不敏感', () => {
    setKeyword('cola')
    search()
    expect(state.results.map((r) => r.name)).toEqual(['Cola Mini'])
  })

  it('仅当前工作表范围', () => {
    setKeyword('600ml')
    search()
    expect(state.searchPhase).toBe('empty-result')
  })

  it('空关键词不执行', () => {
    setKeyword('   ')
    search()
    expect(state.searchPhase).toBe('idle')
  })
})

describe('结果过期清空 (order-search spec, 回归保持)', () => {
  it('关键词变更后清空旧结果（保留关键词）', () => {
    setKeyword('可乐')
    search()
    setKeyword('雪碧')
    expect(state.searchPhase).toBe('idle')
    expect(state.results).toEqual([])
    expect(state.keyword).toBe('雪碧')
  })

  it('切换工作表后清空（关键词保留）+ 回调触发', () => {
    let callbackSheet: string | null = null
    openWorkbookSession(makeWorkbook(), null, {
      onSheetChange: (s) => (callbackSheet = s),
    })
    setKeyword('可乐')
    search()
    switchSheet('江店1')
    expect(state.searchPhase).toBe('idle')
    expect(state.results).toEqual([])
    expect(state.keyword).toBe('可乐')
    expect(callbackSheet).toBe('江店1')
  })
})

describe('格式不符工作表 (excel-import spec, 回归保持)', () => {
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
  })
})

describe('浏览模式 (order-search spec: 未搜索时展示全部记录)', () => {
  it('未搜索时 browseRows = 当前门店全部记录', async () => {
    const { browseRows } = await import('./useWorkbook')
    expect(browseRows.value).toHaveLength(4) // 沿河店 4 条
  })

  it('切换门店后 browseRows 随之切换', async () => {
    const { browseRows } = await import('./useWorkbook')
    switchSheet('江店1')
    expect(browseRows.value).toHaveLength(1)
    expect(browseRows.value[0].name).toBe('可乐600ml')
  })

  it('搜索行为不受浏览模式影响', async () => {
    const { browseRows } = await import('./useWorkbook')
    setKeyword('可乐')
    search()
    // searchPhase=has-result 时 UI 层走 state.results，browseRows 仍为全部
    expect(state.searchPhase).toBe('has-result')
    expect(browseRows.value).toHaveLength(4)
    setKeyword('') // 关键词清空 → idle → UI 回浏览
    expect(state.searchPhase).toBe('idle')
  })
})
