import { describe, expect, it } from 'vitest'
import { formatRowText } from './clipboard'

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
