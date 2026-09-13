import type { ColumnKey } from '../services/types'

/** 结果表单列定义（表头与数据行共用） */
export interface TableColumn {
  /** OrderRow 字段键：数据行取值与 CSS 列类名（c-<key>）同源 */
  key: ColumnKey
  /** 表头列名（order-search spec：列名与顺序固定为 商品名称/条形码/货架号/价格） */
  label: string
}

/**
 * 列定义唯一事实源：表头（列名）与数据行（取值）都从它渲染，
 * 两侧子元素结构（列 span + 零宽 TAB 分隔 sep）逐一对齐。
 * 2026-09-13「价格 title 与数字列错位」教训：此前表头手写 4 个 span、
 * 数据行手写 4 列 + 3 个 sep，两侧 flex 子元素 / gap 数不同导致列几何分叉，
 * 数据列逐列右移（价格 +5.76px）——列结构从此只允许在这里定义一次。
 */
export const TABLE_COLUMNS: readonly TableColumn[] = [
  { key: 'name', label: '商品名称' },
  { key: 'barcode', label: '条形码' },
  { key: 'shelf', label: '货架号' },
  { key: 'price', label: '价格' },
]
