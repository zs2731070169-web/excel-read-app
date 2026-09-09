<script setup lang="ts">
import { showToast } from 'vant'
import type { OrderRow } from '../services/types'

const props = defineProps<{ row: OrderRow }>()

/**
 * 整行复制：TAB 分隔四字段（result-copy spec: 粘到 Excel 自动分列）。
 * navigator.clipboard 需安全上下文，WebView 兼容路径 execCommand fallback（design D5）。
 */
async function copyRow(): Promise<void> {
  const text = `${props.row.name}\t${props.row.barcode}\t${props.row.shelf}\t${props.row.price}`
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      fallbackCopy(text)
    }
    showToast('已复制')
  } catch {
    try {
      fallbackCopy(text)
      showToast('已复制')
    } catch {
      showToast('复制失败，请长按文字手动复制')
    }
  }
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
</script>

<!--
  原生结构渲染（result-copy spec / design D5）：
  不用 Vant 文本组件 —— 全局 user-select:none 主题会杀死长按选择。
-->
<template>
  <div class="row">
    <span class="c-name">{{ row.name }}</span>
    <span class="c-barcode">{{ row.barcode }}</span>
    <span class="c-shelf">{{ row.shelf }}</span>
    <span class="c-price">{{ row.price }}</span>
    <button class="c-op copy-btn" type="button" aria-label="复制本行" @click="copyRow">
      复制
    </button>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fff;
  border-bottom: 1px solid #f2f3f5;
  font-size: 14px;
  line-height: 1.4;
  /* 核心声明：允许长按系统选择（含 -webkit 前缀覆盖 WebView） */
  user-select: text;
  -webkit-user-select: text;
  -webkit-touch-callout: default;
}

.c-name {
  width: 32%;
  word-break: break-all;
  color: #323233;
}

.c-barcode {
  width: 30%;
  word-break: break-all;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 13px;
  color: #323233;
}

.c-shelf { width: 15%; color: #323233; }
.c-price { width: 12%; color: #ee0a24; }

.c-op {
  width: 11%;
  flex-shrink: 0;
}

.copy-btn {
  border: 1px solid #1989fa;
  background: #fff;
  color: #1989fa;
  border-radius: 4px;
  font-size: 12px;
  padding: 3px 8px;
}
</style>
