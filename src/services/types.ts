/** 单条订单记录 —— 四字段全部为文本（design.md D2: raw:false） */
export interface OrderRow {
  /** 商品名称 */
  name: string
  /** 条形码（UPC），文本原样，保留前导零 */
  barcode: string
  /** 货架号 */
  shelf: string
  /** 价格（文本展示，不强制货币符号） */
  price: string
}

/** 单个工作表（门店）的解析结果 */
export interface SheetResult {
  /** 工作表名（门店名，如 沿河店） */
  name: string
  /** 表头四列是否齐全（缺列则不可搜索，但不出现在列表外） */
  valid: boolean
  /** 缺失的列名（valid=false 时用于提示） */
  missingColumns?: string[]
  /** 数据行（valid=true 时从第 2 行起） */
  rows: OrderRow[]
}

/** 整个工作簿的解析结果 */
export interface WorkbookData {
  fileName: string
  importedAt: number
  sheets: SheetResult[]
}

/** 表头别名集合（excel-import spec: 大小写不敏感、trim 后匹配） */
export const COLUMN_ALIASES: Record<'name' | 'barcode' | 'shelf' | 'price', string[]> = {
  name: ['商品名称', '品名', '名称'],
  barcode: ['条形码', 'upc码', '条码', 'upc'],
  shelf: ['货架号', '货架', '架号'],
  price: ['价格', 'price'],
}

export type ColumnKey = keyof typeof COLUMN_ALIASES
