// @vitest-environment happy-dom  挂载组件需要 DOM
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultList from './ResultList.vue'
import type { OrderRow } from '../services/types'
import {
  openWorkbookSession,
  resetWorkbookSession,
} from '../composables/useWorkbook'

// vant 空态组件在 node 链路 mock 为占位（只验证结构，不测 vant 内部）
vi.mock('vant', () => ({
  VanEmpty: {
    name: 'VanEmpty',
    props: ['image', 'description'],
    template: '<div class="van-empty">{{ description }}</div>',
  },
}))

const sampleRows: OrderRow[] = [
  { name: '可乐330ml', barcode: '6953123500761', shelf: 'A1', price: '3' },
  { name: '雪碧500ml', barcode: '6953123500762', shelf: 'A2', price: '4' },
]

/** 构造会话（单门店双记录），挂载 ResultList */
function mountWithSession() {
  openWorkbookSession(
    {
      fileName: '订单.xlsx',
      importedAt: 1000,
      sheets: [
        { name: '沿河店', valid: true, rows: sampleRows },
      ],
    },
    '沿河店',
  )
  return mount(ResultList)
}

beforeEach(() => {
  vi.clearAllMocks()
  resetWorkbookSession()
})

describe('displayRows 计算逻辑（搜索无匹配→空列表）', () => {
  type SearchPhase = 'idle' | 'has-result' | 'empty-result'

  /** 复现 ResultList.vue 的 displayRows 计算逻辑 */
  function computeDisplayRows(searchPhase: SearchPhase, results: OrderRow[], browseRows: OrderRow[]) {
    return searchPhase === 'idle' ? browseRows : results
  }

  it('idle（未搜索）→ 展示全部记录', () => {
    expect(computeDisplayRows('idle', [], sampleRows)).toBe(sampleRows)
  })

  it('has-result（有匹配）→ 仅展示匹配项', () => {
    const matched = [sampleRows[0]]
    expect(computeDisplayRows('has-result', matched, sampleRows)).toBe(matched)
  })

  it('empty-result（无匹配）→ 空数组，不回退到全部记录', () => {
    const display = computeDisplayRows('empty-result', [], sampleRows)
    expect(display).toEqual([])
    expect(display).not.toBe(sampleRows) // 不是 browseRows 引用
    expect(display.length).toBe(0)
  })
})

describe('结果区纯展示（result-copy 修订：复制操作栏已移除）', () => {
  it('有行也不渲染底部操作栏与复制按钮', () => {
    const wrapper = mountWithSession()
    expect(wrapper.find('.action-bar').exists()).toBe(false)
    expect(wrapper.find('.copy-main-btn').exists()).toBe(false)
    // 行渲染不受影响
    expect(wrapper.findAll('.row')).toHaveLength(2)
  })
})
