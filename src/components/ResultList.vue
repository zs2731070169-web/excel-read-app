<script setup lang="ts">
import { useWorkbook } from '../composables/useWorkbook'
import ResultRow from './ResultRow.vue'

const { state, activeSheet } = useWorkbook()
</script>

<template>
  <section class="result-area">
    <!-- 表头列名固定（order-search spec） -->
    <div v-if="state.searchPhase === 'has-result'" class="col-header">
      <span class="c-name">商品名称</span>
      <span class="c-barcode">条形码</span>
      <span class="c-shelf">货架号</span>
      <span class="c-price">价格</span>
      <span class="c-op"></span>
    </div>

    <div v-if="state.searchPhase === 'has-result'" class="rows">
      <ResultRow v-for="(row, i) in state.results" :key="i" :row="row" />
      <div class="result-count">共 {{ state.results.length }} 条</div>
    </div>

    <!-- 空态一：无匹配结果 -->
    <van-empty
      v-else-if="state.searchPhase === 'empty-result'"
      image="search"
      description="无匹配结果"
    />

    <!-- 空态二：未搜索（含关键词变更后的过期提示） -->
    <div v-else class="placeholder">
      <template v-if="state.workbook === null">
        <p>尚未导入文档</p>
        <p class="hint">点击右上角「Excel导入」开始使用</p>
      </template>
      <template v-else-if="activeSheet && !activeSheet.valid">
        <p>当前工作表格式不符</p>
        <p class="hint">缺少列：{{ activeSheet.missingColumns?.join('、') }}，请检查文档或切换其他工作表</p>
      </template>
      <template v-else-if="state.keyword.trim() !== ''">
        <p>结果已过期</p>
        <p class="hint">点击「搜索」查看「{{ state.keyword }}」的结果</p>
      </template>
      <template v-else>
        <p>输入关键词开始搜索</p>
        <p class="hint">支持商品名称或货架号，在当前选中的工作表内查找</p>
      </template>
    </div>
  </section>
</template>

<style scoped>
.result-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(16px + var(--safe-bottom));
}

.col-header {
  position: sticky;
  top: 0;
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background: #f7f8fa;
  font-size: 12px;
  color: #969799;
  z-index: 1;
}

.c-name { width: 32%; }
.c-barcode { width: 30%; }
.c-shelf { width: 15%; }
.c-price { width: 12%; }
.c-op { width: 11%; }

.placeholder {
  padding: 48px 24px;
  text-align: center;
  color: #323233;
}

.placeholder .hint {
  margin-top: 8px;
  font-size: 13px;
  color: #969799;
}

.result-count {
  padding: 10px;
  text-align: center;
  font-size: 12px;
  color: #c8c9cc;
}
</style>
