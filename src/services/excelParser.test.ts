import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { parseWorkbook } from './excelParser'

/** 用 SheetJS 现场写测试工作簿（aoa = array-of-arrays），返回 ArrayBuffer */
function fixture(sheets: Record<string, unknown[][]>, ext: 'xlsx' | 'xls' = 'xlsx'): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  for (const [name, aoa] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name)
  }
  const buf = XLSX.write(wb, { bookType: ext, type: 'array' })
  return buf as ArrayBuffer
}

describe('parseWorkbook — 双格式读取 (2.1)', () => {
  const data = {
    沿河店: [
      ['商品名称', '条形码', '货架号', '价格'],
      ['[杜蕾斯]大胆爱', '695312350076A', '123', '13'],
    ],
  }

  it('解析 .xlsx', () => {
    const wb = parseWorkbook(fixture(data), '订单.xlsx')
    expect(wb.sheets).toHaveLength(1)
    expect(wb.sheets[0].valid).toBe(true)
    expect(wb.fileName).toBe('订单.xlsx')
  })

  it('解析 .xls（Excel 97-2004）同等成功', () => {
    const wb = parseWorkbook(fixture(data, 'xls'), '订单.xls')
    expect(wb.sheets[0].valid).toBe(true)
    expect(wb.sheets[0].rows[0].barcode).toBe('695312350076A')
  })
})

describe('表头别名识别 (2.2)', () => {
  it('标准表头', () => {
    const wb = parseWorkbook(
      fixture({ s: [['商品名称', '条形码', '货架号', '价格'], ['可乐', '6901', 'A1', '3']] }),
      'f.xlsx',
    )
    expect(wb.sheets[0].valid).toBe(true)
    expect(wb.sheets[0].rows[0]).toEqual({ name: '可乐', barcode: '6901', shelf: 'A1', price: '3' })
  })

  it('别名「UPC码」识别为条形码列', () => {
    const wb = parseWorkbook(
      fixture({ s: [['商品名称', 'UPC码', '货架号', '价格'], ['可乐', '6901', 'A1', '3']] }),
      'f.xlsx',
    )
    expect(wb.sheets[0].valid).toBe(true)
    expect(wb.sheets[0].rows[0].barcode).toBe('6901')
  })

  it('表头乱序仍按文字映射（货架号在 A 列）', () => {
    const wb = parseWorkbook(
      fixture({ s: [['货架号', '商品名称', '价格', '条形码'], ['A1', '可乐', '3', '6901']] }),
      'f.xlsx',
    )
    const row = wb.sheets[0].rows[0]
    expect(row).toEqual({ name: '可乐', barcode: '6901', shelf: 'A1', price: '3' })
  })

  it('表头带空白与大小写混合（trim + toLowerCase）', () => {
    const wb = parseWorkbook(
      fixture({ s: [[' 商品名称 ', 'Upc', '货架号', '价格'], ['可乐', '6901', 'A1', '3']] }),
      'f.xlsx',
    )
    expect(wb.sheets[0].valid).toBe(true)
  })

  it('缺少必需列 → invalid + missingColumns，不阻断其他 Sheet', () => {
    const wb = parseWorkbook(
      fixture({
        坏表: [['商品名称', '价格'], ['可乐', '3']],
        好表: [['商品名称', '条形码', '货架号', '价格'], ['可乐', '6901', 'A1', '3']],
      }),
      'f.xlsx',
    )
    const bad = wb.sheets.find((s) => s.name === '坏表')!
    const good = wb.sheets.find((s) => s.name === '好表')!
    expect(bad.valid).toBe(false)
    expect(bad.missingColumns).toEqual(['条形码', '货架号'])
    expect(bad.rows).toEqual([])
    expect(good.valid).toBe(true)
  })
})

describe('数据行清洗与文本化 (2.3)', () => {
  it('长数字条形码不落科学计数法', () => {
    const wb = parseWorkbook(
      fixture({
        s: [
          ['商品名称', '条形码', '货架号', '价格'],
          ['测试', 6953123500761, 123, 13.5],
        ],
      }),
      'f.xlsx',
    )
    const barcode = wb.sheets[0].rows[0].barcode
    expect(barcode).toBe('6953123500761')
    expect(barcode.toLowerCase()).not.toContain('e+')
  })

  it('全空行跳过', () => {
    const wb = parseWorkbook(
      fixture({
        s: [
          ['商品名称', '条形码', '货架号', '价格'],
          ['可乐', '6901', 'A1', '3'],
          ['', '', '', ''],
          [null, null, null, null],
          ['雪碧', '6902', 'A2', '3.5'],
        ],
      }),
      'f.xlsx',
    )
    expect(wb.sheets[0].rows).toHaveLength(2)
    expect(wb.sheets[0].rows[1].name).toBe('雪碧')
  })

  it('价格纯数字原样文本展示（不加符号）', () => {
    const wb = parseWorkbook(
      fixture({ s: [['商品名称', '条形码', '货架号', '价格'], ['可乐', '6901', 'A1', 13.5]] }),
      'f.xlsx',
    )
    expect(wb.sheets[0].rows[0].price).toBe('13.5')
  })
})

describe('边界与错误 (2.4)', () => {
  it('损坏/非 Excel 文件抛错（由调用方捕获提示）', () => {
    const garbage = new TextEncoder().encode('这不是excel文件，只是文本').buffer as ArrayBuffer
    expect(() => parseWorkbook(garbage, 'bad.xlsx')).toThrow()
  })

  it('空工作表：invalid 或空数据，不崩溃', () => {
    const wb = parseWorkbook(fixture({ 空表: [] }), 'f.xlsx')
    const sheet = wb.sheets[0]
    expect(sheet.rows).toEqual([])
  })

  it('仅有表头无数据行 → valid 但 rows 为空', () => {
    const wb = parseWorkbook(
      fixture({ s: [['商品名称', '条形码', '货架号', '价格']] }),
      'f.xlsx',
    )
    expect(wb.sheets[0].valid).toBe(true)
    expect(wb.sheets[0].rows).toEqual([])
  })
})
