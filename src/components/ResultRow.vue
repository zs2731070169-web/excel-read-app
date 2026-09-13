<script setup lang="ts">
import type { OrderRow } from '../services/types'
import { TABLE_COLUMNS } from './tableColumns'

defineProps<{
  row: OrderRow
}>()
</script>

<!--
  原生结构渲染（result-copy spec / design D5）：
  不用 Vant 文本组件 —— 全局 user-select:none 主题会杀死长按选择。
  字段分隔：<span class="sep">{{ '\t' }}</span> 表达式注入字面 TAB——
  两层坑（7.3 探针实证）：① 标签间空白文本被 Vue whitespace:'condense' 移除；
  ② 模板实体 &#9; 经实体解析渲染成普通空格。字符串表达式是运行时值，两者皆避。
  font-size:0 让 TAB 不占可见宽度（显示紧贴、复制带分隔）。
  列序列与表头同源渲染（TABLE_COLUMNS）：两侧子元素 / gap 结构逐一致是
  列对齐的前提（2026-09-13 错位修复），几何（宽度/gap）在全局 table.css。
  勾选复制与底部一键复制均已移除（remove-library-and-selection）：行为纯展示行，
  复制仅剩长按自由选择（格式尽力而为）。
  商品名称超长单行省略（order-search spec）：text-overflow 只裁显示不裁 DOM 文本，
  长按选择仍取到完整名称。
-->
<template>
  <div class="row table-line">
    <template v-for="(column, columnIndex) in TABLE_COLUMNS" :key="column.key">
      <span v-if="columnIndex > 0" class="sep">{{ '\t' }}</span>
      <span :class="`c-${column.key}`">{{ row[column.key] }}</span>
    </template>
  </div>
</template>

<style scoped>
.row {
  /* 水平几何（flex/gap/padding-inline/列宽）在全局 table.css .table-line，与表头共用 */
  align-items: center;
  padding-top: 10px;
  padding-bottom: 10px;
  background: #fff;
  border-bottom: 1px solid #f2f3f5;
  font-size: 14px;
  line-height: 1.4;
  /* 核心声明：允许长按系统选择（含 -webkit 前缀覆盖 WebView） */
  user-select: text;
  -webkit-user-select: text;
  -webkit-touch-callout: default;
}

/* 商品名称：单行省略（超长截断不换行撑高），DOM 文本保留全名供复制 */
.c-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #323233;
}

.c-barcode {
  word-break: break-all;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 13px;
  color: #323233;
}

.c-shelf { color: #323233; }
.c-price { color: #ee0a24; }

/* TAB 分隔符选择能力（宽度置零在全局 table.css）：复制走长按，分隔符必须可选 */
.sep {
  user-select: text;
  -webkit-user-select: text;
}
</style>
