import { describe, expect, it } from 'vitest'
import { formatRowText, joinRowsText } from './clipboard'
import type { OrderRow } from './types'

describe('formatRowText（result-copy spec: 行格式 TAB 分隔）', () => {
  it('四字段 TAB 分隔（粘到表格自动分列）', () => {
    expect(formatRowText({ name: '倍力乐', barcode: '694621797809', shelf: 'A362-2', price: '13' })).toBe(
      '倍力乐\t694621797809\tA362-2\t13',
    )
  })

  it('空字段保留 TAB 占位（列对齐不串列）', () => {
    expect(formatRowText({ name: '可乐', barcode: '', shelf: 'B1', price: '3.5' })).toBe('可乐\t\tB1\t3.5')
  })
})

describe('joinRowsText（result-copy spec: 一键复制当前列表，行间换行）', () => {
  const rows: OrderRow[] = [
    { name: '可乐330ml', barcode: '6953123500761', shelf: 'A1', price: '3' },
    { name: '雪碧500ml', barcode: '6953123500762', shelf: 'A2', price: '4' },
  ]

  it('多行拼装：行内 TAB、行间换行', () => {
    expect(joinRowsText(rows)).toBe(
      '可乐330ml\t6953123500761\tA1\t3\n雪碧500ml\t6953123500762\tA2\t4',
    )
  })

  it('空数组 → 空字符串', () => {
    expect(joinRowsText([])).toBe('')
  })
})
