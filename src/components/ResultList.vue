<script setup lang="ts">
import { showToast } from 'vant'
import { computed } from 'vue'
import { useWorkbook } from '../composables/useWorkbook'
import { copyTextToClipboard, joinRowsText } from '../services/clipboard'
import ResultRow from './ResultRow.vue'

const { state, activeSheet, browseRows } = useWorkbook()

/**
 * 当前应展示的行：搜索结果（has-result/empty-result）或浏览模式全部记录（idle）。
 * MUST computed —— 依赖响应式 searchPhase，一次性求值会冻结显示（design D6 教训）。
 */
const displayRows = computed(() =>
  state.searchPhase === 'idle' ? browseRows.value : state.results,
)
const isBrowsing = computed(() => state.searchPhase === 'idle' && state.workbook !== null)

/**
 * 一键复制当前列表（result-copy spec）：搜索态复制当前结果，浏览态复制当前门店全部；
 * 格式由 joinRowsText 保证（行内 TAB 分隔、行间换行）。
 * 操作栏仅在列表有行时渲染，故此处无需空列表防御。
 */
async function copyCurrentList(): Promise<void> {
  const rows = displayRows.value
  try {
    await copyTextToClipboard(joinRowsText(rows))
    showToast(`已复制 ${rows.length} 条`)
  } catch {
    showToast('复制失败，请长按文字手动复制')
  }
}
</script>

<template>
  <section class="result-area">
    <!-- 表头列名固定（order-search spec；勾选列已随勾选复制移除） -->
    <div v-if="displayRows.length > 0" class="col-header">
      <span class="c-name">商品名称</span>
      <span class="c-barcode">条形码</span>
      <span class="c-shelf">货架号</span>
      <span class="c-price">价格</span>
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

    <!-- 底部操作栏（result-copy spec）：一键复制当前列表，按钮恒可用 -->
    <div v-if="displayRows.length > 0" class="action-bar">
      <van-button
        type="primary"
        size="small"
        round
        class="copy-main-btn"
        @click="copyCurrentList"
      >
        复制 {{ displayRows.length }} 条
      </van-button>
    </div>
  </section>
</template>

<style scoped>
.result-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  /* 底部留出固定操作栏高度 */
  padding-bottom: calc(64px + var(--safe-bottom));
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

/* 四列宽度与 ResultRow 行内一致（勾选列移除后重分配：32/29/15/24） */
.c-name { width: 32%; }
.c-barcode { width: 29%; }
.c-shelf { width: 15%; }
.c-price { width: 24%; text-align: left; }

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

/* 底部操作栏：固定于结果区底，不随列表滚动（勾选复制移除后仅剩主复制按钮）。
   栏贴底不变，仅加大底内边距把内容抬高手势条（真机反馈：太贴底） */
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 16px calc(20px + var(--safe-bottom));
  background: #fff;
  border-top: 1px solid #ebedf0;
  z-index: 5;
}

.copy-main-btn {
  min-width: 132px;
  font-weight: 500;
}
</style>
