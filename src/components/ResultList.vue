<script setup lang="ts">
import { computed } from 'vue'
import { useWorkbook } from '../composables/useWorkbook'
import ResultRow from './ResultRow.vue'
import { TABLE_COLUMNS } from './tableColumns'

const { state, activeSheet, browseRows } = useWorkbook()

/**
 * 当前应展示的行：搜索结果（has-result/empty-result）或浏览模式全部记录（idle）。
 * MUST computed —— 依赖响应式 searchPhase，一次性求值会冻结显示（design D6 教训）。
 */
const displayRows = computed(() =>
  state.searchPhase === 'idle' ? browseRows.value : state.results,
)
const isBrowsing = computed(() => state.searchPhase === 'idle' && state.workbook !== null)
</script>

<template>
  <section class="result-area">
    <!-- 表头列名固定（order-search spec；勾选列已随勾选复制移除）。
         与 ResultRow 同源渲染（TABLE_COLUMNS + 零宽 sep 镜像）：两侧 flex 子元素 /
         gap 结构必须逐一致，列名才能与数据列对齐（2026-09-13 错位修复，几何见 table.css） -->
    <div v-if="displayRows.length > 0" class="col-header table-line">
      <template v-for="(column, columnIndex) in TABLE_COLUMNS" :key="column.key">
        <span v-if="columnIndex > 0" class="sep">{{ '\t' }}</span>
        <span :class="`c-${column.key}`">{{ column.label }}</span>
      </template>
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
        <p class="hint">可切换其他门店检查数据</p>
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
  /* 底部常规呼吸留白（固定复制操作栏已移除，result-copy 修订） */
  padding-bottom: calc(16px + var(--safe-bottom));
}

.col-header {
  position: sticky;
  top: 0;
  /* 水平几何（flex/gap/padding-inline/列宽）在全局 table.css .table-line，与数据行共用 */
  padding-top: 8px;
  padding-bottom: 8px;
  background: #f7f8fa;
  font-size: 12px;
  color: #969799;
  z-index: 1;
}

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
