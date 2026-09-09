/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import * as fs from 'node:fs'
import { parseWorkbook } from './excelParser'

/** 真实文件回归夹具（design D6 / tasks 6.4）：4 门店 × 101 行，倍力乐在尾部（行 99/100）。
 *  防两类回归：解析丢尾行、表头识别失败。 */
describe('真实文件回归（extended.xlsx）', () => {
  function loadWorkbook() {
    const buf = fs.readFileSync(new URL('./fixtures/extended.xlsx', import.meta.url))
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
    return parseWorkbook(ab, '商品名称_扩展版.xlsx')
  }

  it('每个门店解析出完整 101 行（尾行不丢失）', () => {
    const wb = loadWorkbook()
    expect(wb.sheets).toHaveLength(4)
    for (const sheet of wb.sheets) {
      expect(sheet.valid, sheet.name).toBe(true)
      expect(sheet.rows.length, sheet.name).toBe(101)
    }
  })

  it('尾部行「倍力乐」完整保留且可被关键词命中', () => {
    const wb = loadWorkbook()
    for (const sheet of wb.sheets) {
      const hits = sheet.rows.filter((r) => r.name.includes('倍力乐'))
      expect(hits.length, sheet.name).toBe(2)
      expect(hits[0].barcode).toMatch(/^69\d+$/) // 条形码完整非科学计数法
    }
  })

  it('货架号/价格字段化正确（真实数据形态）', () => {
    const wb = loadWorkbook()
    const row = wb.sheets[0].rows[98] // 德江店1 第一条倍力乐
    expect(row.shelf).toBe('A362-2')
    expect(row.price).toBe('13')
  })
})
