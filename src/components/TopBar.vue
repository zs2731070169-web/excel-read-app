<script setup lang="ts">
import { computed } from 'vue'
import { useLibrary } from '../composables/useLibrary'
import { useWorkbook } from '../composables/useWorkbook'

const { closeWorkbook } = useLibrary()
const { state, sheetNames, switchSheet } = useWorkbook()

/** 下拉框选项：Sheet 名 + 无效标记（格式不符的 Sheet 可见但提示） */
const options = computed(() =>
  sheetNames.value.map((name) => {
    const sheet = state.workbook?.sheets.find((s) => s.name === name)
    return { text: sheet?.valid === false ? `${name}（格式不符）` : name, value: name }
  }),
)

function onSelectSheet(name: string) {
  switchSheet(name)
}
</script>

<template>
  <header class="top-bar">
    <!-- 左：返回文件库 -->
    <van-icon name="arrow-left" size="20" class="back-btn" @click="closeWorkbook" />

    <!-- 中左：工作表下拉（仅工作簿页渲染此组件） -->
    <div class="picker-wrap">
      <van-dropdown-menu>
        <van-dropdown-item
          :model-value="state.activeSheetName ?? ''"
          :options="options"
          @change="onSelectSheet"
        />
      </van-dropdown-menu>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  /* 顶边距 = 状态栏高度 + 24px 呼吸间距（真机调优定稿） */
  padding-top: calc(24px + var(--safe-top));
  background: #fff;
  border-bottom: 1px solid #ebedf0;
}

.back-btn {
  padding: 6px;
  color: #323233;
  flex-shrink: 0;
}

.picker-wrap {
  flex: 1;
  min-width: 0;
}

.picker-wrap :deep(.van-dropdown-menu__bar) {
  box-shadow: none;
  height: 40px;
  background: transparent;
}
</style>
