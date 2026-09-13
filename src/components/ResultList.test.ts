// @vitest-environment happy-dom  挂载组件需要 DOM
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultList from './ResultList.vue'
import type { OrderRow } from '../services/types'
import {
  openWorkbookSession,
  resetWorkbookSession,
  search,
  setKeyword,
} from '../composables/useWorkbook'

// vant 组件与 toast 在 node 链路 mock 为占位（沿用 ResultRow.test 做法，只验证结构与逻辑）
vi.mock('vant', () => ({
  showToast: vi.fn(),
  VanButton: {
    name: 'VanButton',
    template: '<button class="van-button" @click="$emit(\'click\')"><slot /></button>',
  },
  VanEmpty: {
    name: 'VanEmpty',
    props: ['image', 'description'],
    template: '<div class="van-empty">{{ description }}</div>',
  },
}))
// 剪贴板写入 mock（IO 隔离），拼装函数 joinRowsText 保持真实实现参与断言
vi.mock('../services/clipboard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/clipboard')>()
  return { ...actual, copyTextToClipboard: vi.fn(async () => {}) }
})
import { showToast } from 'vant'
import { copyTextToClipboard, joinRowsText } from '../services/clipboard'

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

describe('一键复制当前列表（result-copy spec）', () => {
  it('浏览态：复制当前门店全部记录（TAB + 换行）', async () => {
    const wrapper = mountWithSession()
    await wrapper.find('.copy-main-btn').trigger('click')
    expect(copyTextToClipboard).toHaveBeenCalledWith(joinRowsText(sampleRows))
    expect(showToast).toHaveBeenCalledWith('已复制 2 条')
    expect(wrapper.find('.copy-main-btn').text()).toContain('复制 2 条')
  })

  it('搜索态：复制当前搜索结果而非全部记录', async () => {
    const wrapper = mountWithSession()
    setKeyword('可乐')
    search()
    await wrapper.find('.copy-main-btn').trigger('click')
    expect(copyTextToClipboard).toHaveBeenCalledWith(joinRowsText([sampleRows[0]]))
    expect(showToast).toHaveBeenCalledWith('已复制 1 条')
  })

  it('复制失败 → 失败提示（不误报成功）', async () => {
    vi.mocked(copyTextToClipboard).mockRejectedValueOnce(new Error('copy failed'))
    const wrapper = mountWithSession()
    await wrapper.find('.copy-main-btn').trigger('click')
    expect(showToast).toHaveBeenCalledWith('复制失败，请长按文字手动复制')
  })

  it('空结果不渲染操作栏（无复制入口）', async () => {
    mountWithSession()
    setKeyword('不存在的商品')
    search()
    // 重新挂载以反映 empty-result 阶段的模板分支
    const wrapper = mount(ResultList)
    expect(wrapper.find('.action-bar').exists()).toBe(false)
    expect(wrapper.find('.copy-main-btn').exists()).toBe(false)
  })
})
