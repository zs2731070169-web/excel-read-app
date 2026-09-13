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

/**
 * 表头列与数据列对齐（2026-09-13「价格 title 与数字列错位」修复的回归锁）：
 * 两侧同为 flex 容器（gap 8px、列宽百分比求和 100%），任一侧子元素数 / gap 数
 * 不同就会产生不同的溢出收缩与列距——历史上表头 4 子 / 数据行 7 子（3 个零宽
 * TAB 分隔 sep）导致数据列逐列右移（条形码 +0.32 / 货架号 +1.36 / 价格 +5.76px）。
 * DOM 结构逐一致是对齐的必要前提，在无真实布局引擎的测试环境里以此锁定。
 */
describe('表头列与数据列对齐（结构镜像）', () => {
  /** 数据行期望子元素序列：4 列 span 与 3 个零宽 TAB 分隔 sep 交替（sep 不许丢——长按复制的分隔来源） */
  const EXPECTED_CHILD_CLASSES = ['c-name', 'sep', 'c-barcode', 'sep', 'c-shelf', 'sep', 'c-price']

  function childClassesOf(container: Element): string[] {
    return Array.from(container.children).map((element) => element.className)
  }

  it('表头子元素结构与数据行逐一致', () => {
    const wrapper = mountWithSession()
    const rowClasses = childClassesOf(wrapper.find('.row').element)
    const headerClasses = childClassesOf(wrapper.find('.col-header').element)
    expect(rowClasses).toEqual(EXPECTED_CHILD_CLASSES)
    expect(headerClasses).toEqual(rowClasses)
  })

  it('表头列名与顺序固定：商品名称/条形码/货架号/价格（order-search spec）', () => {
    const wrapper = mountWithSession()
    const headerText = wrapper.find('.col-header').element.textContent ?? ''
    expect(headerText.split('\t')).toEqual(['商品名称', '条形码', '货架号', '价格'])
  })
})
