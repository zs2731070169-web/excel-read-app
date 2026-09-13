import type { OrderRow } from './types'

/**
 * 剪贴板写入（result-copy spec）：navigator.clipboard 优先（安全上下文），
 * WebView 兼容路径 execCommand fallback（design D5）。
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return
    }
  } catch {
    // 落入 fallback
  }
  fallbackCopy(text)
}

function fallbackCopy(text: string): void {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(ta)
  if (!ok) throw new Error('execCommand copy failed')
}

/** 单行记录 → 「名称→TAB←条形码→TAB←货架号→TAB←价格」（TAB 分隔，粘到表格自动分列；spec 定稿） */
export function formatRowText(row: Readonly<{
  name: string
  barcode: string
  shelf: string
  price: string
}>): string {
  return `${row.name}\t${row.barcode}\t${row.shelf}\t${row.price}`
}

/** 多行拼装（result-copy spec: 一键复制当前列表）——行内 TAB 分隔、行间换行。
 * 入参只读：消费方拿到的是 useWorkbook readonly 视图（深层只读代理），本函数仅读取不修改 */
export function joinRowsText(rows: readonly OrderRow[]): string {
  return rows.map(formatRowText).join('\n')
}
