import * as XLSX from 'xlsx'
import { COLUMN_ALIASES, type ColumnKey, type SheetResult, type WorkbookData } from './types'

/**
 * Excel 订单工作簿解析（design.md D2/D3 约束）：
 * - .xlsx / .xls 双格式：XLSX.read(arrayBuffer) 统一入口
 * - raw:true 读原始值：数字单元格为 double（13-14 位条形码整数精确），
 *   由 textOf 完整字符串化；文本单元格（前导零、含字母）本就是字符串原样保留。
 *   （raw:false 不可用：General 渲染文本在源头就把长数字截断成 6.95312E+12）
 * - 表头别名识别（首行 trim + 大小写不敏感），缺列的 Sheet 标记 invalid，不阻断其他 Sheet
 */
export function parseWorkbook(arrayBuffer: ArrayBuffer, fileName: string): WorkbookData {
  assertExcelFile(arrayBuffer, fileName)
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const sheets: SheetResult[] = workbook.SheetNames.map((name) =>
    parseSheet(name, workbook.Sheets[name]),
  )
  return { fileName, importedAt: Date.now(), sheets }
}

/**
 * 魔数校验：.xlsx = ZIP (PK\x03\x04)，.xls = OLE2 复合文档。
 * SheetJS 会把任意文本嗅探为 CSV 解析成功，必须在 read 前拦下「改名的文本文件」。
 */
function assertExcelFile(buf: ArrayBuffer, fileName: string): void {
  const head = new Uint8Array(buf, 0, Math.min(4, buf.byteLength))
  const isZip = head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04
  const isOle2 = head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0
  if (!isZip && !isOle2) {
    throw new Error(`文件格式无法识别：${fileName}（仅支持 .xlsx / .xls）`)
  }
}

/** 单 Sheet 解析：表头识别 → 行清洗 */
export function parseSheet(sheetName: string, ws: XLSX.WorkSheet | undefined): SheetResult {
  if (!ws) return { name: sheetName, valid: false, missingColumns: Object.keys(COLUMN_ALIASES), rows: [] }

  // header:1 → 二维矩阵；raw:true → 原始值（number/string/boolean）；defval:'' → 空单元格补空串
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: '' })
  if (matrix.length === 0) return { name: sheetName, valid: false, missingColumns: Object.keys(COLUMN_ALIASES), rows: [] }

  const mapping = resolveHeader(matrix[0])
  if (!mapping) {
    return {
      name: sheetName,
      valid: false,
      missingColumns: missingOf(matrix[0]),
      rows: [],
    }
  }

  const rows = []
  for (let i = 1; i < matrix.length; i++) {
    const raw = matrix[i] ?? []
    const name = textOf(raw[mapping.name])
    const barcode = textOf(raw[mapping.barcode])
    const shelf = textOf(raw[mapping.shelf])
    const price = textOf(raw[mapping.price])
    // 全空行跳过（excel-import spec）
    if (name === '' && barcode === '' && shelf === '' && price === '') continue
    rows.push({ name, barcode, shelf, price })
  }
  return { name: sheetName, valid: true, rows }
}

/** 首行表头 → 四列索引映射；任一必需列缺失返回 null */
function resolveHeader(headerRow: unknown[]): Record<ColumnKey, number> | null {
  const normalized = headerRow.map((c) => textOf(c).trim().toLowerCase())
  const find = (aliases: string[]) => normalized.findIndex((h) => aliases.includes(h))
  const idx = {
    name: find(COLUMN_ALIASES.name),
    barcode: find(COLUMN_ALIASES.barcode),
    shelf: find(COLUMN_ALIASES.shelf),
    price: find(COLUMN_ALIASES.price),
  }
  if (Object.values(idx).some((i) => i < 0)) return null
  return idx
}

/** 缺失列名清单（用于「文档格式不符」提示，返回中文列名） */
function missingOf(headerRow: unknown[]): string[] {
  const normalized = headerRow.map((c) => textOf(c).trim().toLowerCase())
  const labels: Record<ColumnKey, string> = { name: '商品名称', barcode: '条形码', shelf: '货架号', price: '价格' }
  return (Object.keys(labels) as ColumnKey[]).filter(
    (k) => !COLUMN_ALIASES[k].some((a) => normalized.includes(a)),
  ).map((k) => labels[k])
}

/**
 * 单元格原始值 → 文本（excel-import spec 硬性要求：不落科学计数法、保留前导零）。
 * raw:true 下：number（double）→ String() 完整十进制（JS 不产生科学计数法，13 位整数精确）；
 * string 原样（文本格式条形码的前导零在此保住）。兜底：万一上游仍给出科学计数法
 * 形态字符串（老 .xls 显示值路径），用 Number 还原（携带精度范围内的还原）。
 */
function textOf(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = String(v).trim()
  if (/^-?\d(\.\d+)?e[+-]?\d+$/i.test(s)) {
    const n = Number(s)
    if (Number.isFinite(n)) return String(n)
  }
  return s
}
