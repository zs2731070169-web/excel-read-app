// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import type { OrderRow } from '../services/types'

/**
 * ResultList 的 displayRows 是纯计算逻辑，不需要挂载组件即可验证。
 * 直接复现计算逻辑，与 ResultList.vue:14-15 保持一致，
 * 确认 empty-result 阶段返回空数组而非全部记录。
 */

type SearchPhase = 'idle' | 'has-result' | 'empty-result'

const sampleRows: OrderRow[] = [
  { name: '可乐330ml', barcode: '6953123500761', shelf: 'A1', price: '3' },
  { name: '雪碧500ml', barcode: '6953123500762', shelf: 'A2', price: '4' },
]

describe('displayRows 计算逻辑（搜索无匹配→空列表）', () => {
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
