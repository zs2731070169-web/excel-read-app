<script setup lang="ts">
import { showToast } from 'vant'
import { computed, ref, watch } from 'vue'
import { useWorkbook } from '../composables/useWorkbook'
import { copyTextToClipboard, formatRowText } from '../services/clipboard'
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

/** 勾选集合（行索引；spec: 切门店/关键词变更时清空） */
const selectedIndexes = ref(new Set<number>())

watch(
  () => [state.activeSheetName, state.keyword, state.searchPhase] as const,
  () => {
    selectedIndexes.value = new Set()
  },
)

const allSelected = computed(
  () => displayRows.value.length > 0 && selectedIndexes.value.size === displayRows.value.length,
)

function toggleRow(index: number) {
  const next = new Set(selectedIndexes.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  selectedIndexes.value = next
}

/** 全选/全不选（7.6 一体化操作栏） */
function toggleSelectAll() {
  selectedIndexes.value = allSelected.value
    ? new Set()
    : new Set(displayRows.value.map((_, i) => i))
}

/**
 * 主复制按钮（7.6 一体化）：勾选了就复制选中行，否则复制当前列表。
 * 同一入口两态，格式统一（TAB 分隔 + 行间换行）。
 */
async function copyMainAction(): Promise<void> {
  const rows = allSelectedOrSelected()
  if (rows.length === 0) return
  const text = rows.map(formatRowText).join('\n')
  try {
    await copyTextToClipboard(text)
    showToast(`已复制 ${rows.length} 条`)
    selectedIndexes.value = new Set()
  } catch {
    showToast('复制失败，请长按文字手动复制')
  }
}

/** 当前应复制的行集合：仅勾选行（未勾选时返回空数组，按钮禁用不触发调用） */
function allSelectedOrSelected() {
  if (selectedIndexes.value.size > 0) {
    return [...selectedIndexes.value]
      .sort((a, b) => a - b)
      .map((i) => displayRows.value[i])
      .filter(Boolean)
  }
  return []
}
</script>

<template>
  <section class="result-area">
    <!-- 表头列名固定（order-search spec） -->
    <div v-if="displayRows.length > 0" class="col-header">
      <span class="c-check-h"></span>
      <span class="c-name">商品名称</span>
      <span class="c-barcode">条形码</span>
      <span class="c-shelf">货架号</span>
      <span class="c-price">价格</span>
    </div>

    <div v-if="displayRows.length > 0" class="rows">
      <ResultRow
        v-for="(row, i) in displayRows"
        :key="i"
        :row="row"
        :index="i"
        :selected="selectedIndexes.has(i)"
        @toggle="toggleRow"
      />
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

    <!-- 一体化底部操作栏（7.6）：全选 + 主复制按钮（两态切换） -->
    <div v-if="displayRows.length > 0" class="action-bar">
      <van-checkbox
        :model-value="allSelected"
        checked-color="#1989fa"
        class="select-all"
        @update:model-value="toggleSelectAll"
      >
        全选
      </van-checkbox>
      <van-button
        type="primary"
        size="small"
        round
        class="copy-main-btn"
        :disabled="selectedIndexes.size === 0"
        @click="copyMainAction"
      >
        {{ selectedIndexes.size > 0 ? `复制选中（${selectedIndexes.size}）` : '请先勾选' }}
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

.c-check-h { width: 22px; flex-shrink: 0; }
.c-name { width: 28%; }
.c-barcode { width: 27%; }
.c-shelf { width: 14%; }
.c-price { width: 22%; text-align: left; }

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

.list-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 0 4px;
}

.result-count {
  padding: 10px;
  text-align: center;
  font-size: 12px;
  color: #c8c9cc;
}

/* 一体化底部操作栏（7.6）：固定于结果区底，不随列表滚动。
   栏贴底不变，仅加大底内边距把内容抬高手势条（真机反馈：太贴底） */
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px calc(20px + var(--safe-bottom));
  background: #fff;
  border-top: 1px solid #ebedf0;
  z-index: 5;
}

.select-all {
  user-select: none;
  -webkit-user-select: none;
}

.copy-main-btn {
  min-width: 132px;
  font-weight: 500;
}
</style>
