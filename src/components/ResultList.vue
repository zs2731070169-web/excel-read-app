<script setup lang="ts">
import { computed } from 'vue'
import { useWorkbook } from '../composables/useWorkbook'
import ResultRow from './ResultRow.vue'

const { state, activeSheet, browseRows } = useWorkbook()

/**
 * 当前应展示的行：搜索结果（has-result/empty-result）或浏览模式全部记录（idle）。
 * MUST computed —— 依赖响应式 searchPhase，一次性求值会冻结显示（design D6 教训）。
 */
const displayRows = computed(() =>
  state.searchPhase === 'has-result' ? state.results : browseRows.value,
)
const isBrowsing = computed(() => state.searchPhase === 'idle' && state.workbook !== null)
</script>

<template>
  <section class="result-area">
    <!-- 表头列名固定（order-search spec） -->
    <div v-if="displayRows.length > 0" class="col-header">
      <span class="c-name">商品名称</span>
      <span class="c-barcode">条形码</span>
      <span class="c-shelf">货架号</span>
      <span class="c-price">价格</span>
      <span class="c-op"></span>
    </div>

    <div v-if="displayRows.length > 0" class="rows">
      <ResultRow v-for="(row, i) in displayRows" :key="i" :row="row" />
      <div class="result-count">
        {{ isBrowsing ? `全部 ${displayRows.length} 条` : `共 ${displayRows.length} 条` }}
      </div>
    </div>

    <!-- 空态一：搜索无匹配结果 -->
    <van-empty
      v-else-if="state.searchPhase === 'empty-result'"
      image="search"
      description="无匹配结果"
    />

    <!-- 空态二：浏览模式下当前门店无记录 -->
    <div v-else-if="isBrowsing" class="placeholder">
      <template v-if="activeSheet && !activeSheet.valid">
        <p>当前工作表格式不符</p>
        <p class="hint">缺少列：{{ activeSheet.missingColumns?.join('、') }}，请检查文档或切换其他工作表</p>
      </template>
      <template v-else>
        <p>本门店暂无记录</p>
        <p class="hint">可切换其他门店或返回文件库检查文件</p>
      </template>
    </div>

    <!-- 空态三：关键词已改未搜索（结果过期） -->
    <div v-else-if="state.keyword.trim() !== ''" class="placeholder">
      <p>结果已过期</p>
      <p class="hint">点击「搜索」查看「{{ state.keyword }}」的结果</p>
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
