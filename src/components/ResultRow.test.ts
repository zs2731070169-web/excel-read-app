// @vitest-environment happy-dom  组件渲染测试需要 DOM
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultRow from './ResultRow.vue'
import type { OrderRow } from '../services/types'

const sample: OrderRow = {
  name: '【倍力乐】草莓香3只装',
  barcode: '694621797809',
  shelf: 'A362-2',
  price: '13',
}

/**
 * 组件层渲染断言（design D6 教训：状态机绿 ≠ DOM 对）。
 * 勾选复制与底部一键复制均已移除（remove-library-and-selection）——守卫两件事：
 * ① TAB 分隔符真实存在于 DOM（长按自由复制的分隔来源）；
 * ② 行内为纯展示结构，不再有复选框等交互元素。
 */
describe('ResultRow 渲染（result-copy spec）', () => {
  it('textContent 含 3 个 TAB 分隔（字段间）', () => {
    const wrapper = mount(ResultRow, { props: { row: sample } })
    const text = wrapper.element.textContent ?? ''
    const tabs = text.split('\t')
    expect(tabs).toHaveLength(4) // 4 字段 = 3 个 TAB
    expect(tabs[0]).toBe(sample.name)
    expect(tabs[1]).toBe(sample.barcode)
    expect(tabs[2]).toBe(sample.shelf)
    expect(tabs[3]).toBe(sample.price)
  })

  it('分隔 span 存在', () => {
    const wrapper = mount(ResultRow, { props: { row: sample } })
    expect(wrapper.findAll('.sep')).toHaveLength(3)
  })

  it('无复选框节点（勾选交互已移除，纯展示行）', () => {
    const wrapper = mount(ResultRow, { props: { row: sample } })
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.findAll('.row > *')).toHaveLength(7) // 4 字段 span + 3 分隔 span
  })
})
