<script setup lang="ts">
import type { OrderRow } from '../services/types'

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
  勾选复制已移除（remove-library-and-selection）：行为纯展示行；
  精确格式复制走底部一键复制，长按自由复制保留为尽力而为。
  商品名称超长单行省略（order-search spec）：text-overflow 只裁显示不裁 DOM 文本，
  长按选择与一键复制仍取到完整名称。
-->
<template>
  <div class="row">
    <span class="c-name">{{ row.name }}</span><span class="sep">{{ '\t' }}</span><span
      class="c-barcode"
      >{{ row.barcode }}</span
    ><span class="sep">{{ '\t' }}</span><span class="c-shelf">{{ row.shelf }}</span
    ><span class="sep">{{ '\t' }}</span><span class="c-price">{{ row.price }}</span>
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

/* 商品名称：单行省略（超长截断不换行撑高），DOM 文本保留全名供复制 */
.c-name {
  width: 32%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #323233;
}

.c-barcode {
  width: 29%;
  word-break: break-all;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 13px;
  color: #323233;
}

.c-shelf { width: 15%; color: #323233; }
.c-price { width: 24%; color: #ee0a24; text-align: left; }

/* TAB 分隔符：存在于 DOM（长按复制带上），不占可见宽度 */
.sep {
  font-size: 0;
  user-select: text;
  -webkit-user-select: text;
}
</style>
