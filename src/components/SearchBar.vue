<script setup lang="ts">
import { showToast } from 'vant'
import { useWorkbook } from '../composables/useWorkbook'

const { state, setKeyword, search } = useWorkbook()

const disabled = state.workbook === null && state.phase !== 'parsing'

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
</style>
