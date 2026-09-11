<script setup lang="ts">
import { showToast } from 'vant'
import { computed } from 'vue'
import { useWorkbook } from '../composables/useWorkbook'

const { state, setKeyword, search } = useWorkbook()

/** 仅在会话中可搜索（本组件只在 workbook 视图渲染；MUST computed——design D6 教训） */
const disabled = computed(() => state.workbook === null)

/** 搜索触发：仅按钮/IME（order-search spec: 方案 B） */
function onSearch() {
  if (state.keyword.trim() === '') {
    showToast('请输入商品名称或货架号')
    return
  }
  search()
}
</script>

<template>
  <div class="search-bar">
    <!-- 搜索按钮置于胶囊外（独立触控区），与 clearable ✕ 结构分离防误触；
         borderless：按钮成为兄弟节点后 field 不再是 last-child，需显式关掉 van-cell 底部发丝线 -->
    <van-field
      :model-value="state.keyword"
      type="search"
      placeholder="输入商品名称 / 货架号"
      :disabled="disabled"
      clearable
      borderless
      class="keyword-field"
      @update:model-value="setKeyword"
      @clear="setKeyword('')"
      @keypress.enter.prevent="onSearch"
    />
    <van-button
      type="primary"
      size="small"
      class="search-button"
      :disabled="disabled"
      @click="onSearch"
    >
      搜索
    </van-button>
  </div>
</template>

<style scoped>
/* 横向布局：输入胶囊撑满剩余宽度，搜索按钮独立于胶囊外，触控区结构性分离 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #ebedf0;
}

.keyword-field {
  flex: 1;
  /* 显式允许胶囊收缩（不依赖 Vant 内部 .van-field__control 的 min-width），防窄屏溢出 */
  min-width: 0;
  padding: 6px 12px;
  background: #f7f8fa;
  border-radius: 6px;
}

/* 隐藏 input[type=search] 的原生清空按钮（安卓 WebView 自带），
   避免与 Vant clearable 的 ✕ 图标同时出现（真机反馈：双清空按钮） */
.keyword-field :deep(input[type='search'])::-webkit-search-cancel-button {
  -webkit-appearance: none;
  display: none;
}

/* 搜索按钮不被压缩（胶囊 flex:1 承担宽度收缩），保证可点击面积 */
.search-button {
  flex-shrink: 0;
}
</style>
