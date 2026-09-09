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
export function formatRowText(row: {
  name: string
  barcode: string
  shelf: string
  price: string
}): string {
  return `${row.name}\t${row.barcode}\t${row.shelf}\t${row.price}`
}
