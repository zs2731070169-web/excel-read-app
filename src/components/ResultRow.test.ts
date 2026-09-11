// @vitest-environment happy-dom  组件渲染测试需要 DOM
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ResultRow from './ResultRow.vue'
import type { OrderRow } from '../services/types'

// vant 组件走 css 导入，node 链路无法加载 —— mock 为占位组件（只验证结构，不测 vant 内部）
vi.mock('vant', () => ({
  showToast: vi.fn(),
  VanCheckbox: {
    name: 'VanCheckbox',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="c-check" @click="$emit(\'update:modelValue\', !modelValue)" />',
  },
}))

const sample: OrderRow = {
  name: '【倍力乐】草莓香3只装',
  barcode: '694621797809',
  shelf: 'A362-2',
  price: '13',
}

/**
 * 组件层渲染断言（design D6 教训：状态机绿 ≠ DOM 对）。
 * 守卫两件事：TAB 分隔符真实存在于 DOM（自由复制的分隔来源）、
 * 勾选框与选中态样式存在（7.4 勾选复制路径）。
 */
describe('ResultRow 渲染（result-copy spec）', () => {
  it('textContent 含 3 个 TAB 分隔（字段间）', () => {
    const wrapper = mount(ResultRow, { props: { row: sample, index: 0, selected: false } })
    const text = wrapper.element.textContent ?? ''
    const tabs = text.split('\t')
    expect(tabs).toHaveLength(4) // 4 字段 = 3 个 TAB
    expect(tabs[0]).toBe(sample.name)
    expect(tabs[1]).toBe(sample.barcode)
    expect(tabs[2]).toBe(sample.shelf)
    expect(tabs[3]).toBe(sample.price)
  })

  it('分隔 span 存在', () => {
    const wrapper = mount(ResultRow, { props: { row: sample, index: 0, selected: false } })
    expect(wrapper.findAll('.sep')).toHaveLength(3)
  })

  it('勾选框存在且选中态加 checked 类', () => {
    const unselected = mount(ResultRow, { props: { row: sample, index: 0, selected: false } })
    expect(unselected.find('.c-check').exists()).toBe(true)
    expect(unselected.classes()).not.toContain('checked')

    const selected = mount(ResultRow, { props: { row: sample, index: 3, selected: true } })
    expect(selected.classes()).toContain('checked')
  })
})
