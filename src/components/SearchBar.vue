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
    <van-field
      :model-value="state.keyword"
      type="search"
      placeholder="输入商品名称 / 货架号"
      :disabled="disabled"
      clearable
      class="keyword-field"
      @update:model-value="setKeyword"
      @clear="setKeyword('')"
      @keypress.enter.prevent="onSearch"
    >
      <template #button>
        <van-button type="primary" size="small" :disabled="disabled" @click="onSearch">
          搜索
        </van-button>
      </template>
    </van-field>
  </div>
</template>

<style scoped>
.search-bar {
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #ebedf0;
}

.keyword-field {
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

/* 搜索按钮与 clearable ✕ 图标之间留触控安全间距，防误触 */
.keyword-field :deep(.van-field__button) {
  margin-left: 4px;
}
</style>
