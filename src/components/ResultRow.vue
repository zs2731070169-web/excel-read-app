<script setup lang="ts">
import { showToast } from 'vant'
import { copyTextToClipboard, formatRowText } from '../services/clipboard'
import type { OrderRow } from '../services/types'

const props = defineProps<{
  row: OrderRow
  /** 行索引（选中集合的 key） */
  index: number
  selected: boolean
}>()

const emit = defineEmits<{
  /** 勾选状态切换 */
  toggle: [index: number]
}>()

/** 整行复制（result-copy spec） */
async function copyRow(): Promise<void> {
  try {
    await copyTextToClipboard(formatRowText(props.row))
    showToast('已复制')
  } catch {
    showToast('复制失败，请长按文字手动复制')
  }
}

function onToggle() {
  emit('toggle', props.index)
}
</script>

<!--
  原生结构渲染（result-copy spec / design D5）：
  不用 Vant 文本组件 —— 全局 user-select:none 主题会杀死长按选择。
  字段分隔：<span class="sep">{{ '\t' }}</span> 表达式注入字面 TAB——
  两层坑（7.3 探针实证）：① 标签间空白文本被 Vue whitespace:'condense' 移除；
  ② 模板实体 &#9; 经实体解析渲染成普通空格。字符串表达式是运行时值，两者皆避。
  font-size:0 让 TAB 不占可见宽度（显示紧贴、复制带分隔）。
  勾选复制（7.4）：行首复选框，精确格式复制的主路径；
  长按自由复制保留为尽力而为（WebView 序列化不可控）。
-->
<template>
  <div class="row" :class="{ checked: selected }">
    <van-checkbox
      :model-value="selected"
      class="c-check"
      checked-color="#1989fa"
      @update:model-value="onToggle"
    />
    <span class="c-name">{{ row.name }}</span><span class="sep">{{ '\t' }}</span><span
      class="c-barcode"
      >{{ row.barcode }}</span
    ><span class="sep">{{ '\t' }}</span><span class="c-shelf">{{ row.shelf }}</span
    ><span class="sep">{{ '\t' }}</span><span class="c-price">{{ row.price }}</span>
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

/* 勾选态视觉反馈 */
.row.checked {
  background: #f0f7ff;
}

.c-check {
  flex-shrink: 0;
  margin-right: 2px;
  /* 复选框不参与文本选择 */
  user-select: none;
  -webkit-user-select: none;
}

.c-name {
  width: 28%;
  word-break: break-all;
  color: #323233;
}

.c-barcode {
  width: 27%;
  word-break: break-all;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 13px;
  color: #323233;
}

.c-shelf { width: 14%; color: #323233; }
.c-price { width: 11%; color: #ee0a24; }

/* TAB 分隔符：存在于 DOM（长按复制带上），不占可见宽度 */
.sep {
  font-size: 0;
  user-select: text;
  -webkit-user-select: text;
}

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
  /* spec: 长按自由选择时按钮文字不得混入复制内容 */
  user-select: none;
  -webkit-user-select: none;
}
</style>
