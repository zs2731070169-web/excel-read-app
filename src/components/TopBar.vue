<script setup lang="ts">
import { computed } from 'vue'
import { useLibrary } from '../composables/useLibrary'
import { useWorkbook } from '../composables/useWorkbook'

const { state: libraryState, startImport } = useLibrary()
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
    <!-- 门店（工作表）下拉：左上角主位，占满除导入按钮外的剩余宽度 -->
    <div class="picker-wrap">
      <van-dropdown-menu>
        <van-dropdown-item
          :model-value="state.activeSheetName ?? ''"
          :options="options"
          @change="onSelectSheet"
        />
      </van-dropdown-menu>
    </div>

    <!-- Excel 导入（文件库页移除后导入入口唯一化于顶栏；解析中 loading 防重复）。
         loading 态置空默认插槽：vant loading 中改显 loading-text，置空防双文案叠加 -->
    <van-button
      type="primary"
      size="small"
      class="import-btn"
      :loading="libraryState.importPhase === 'parsing'"
      loading-text="解析中"
      @click="startImport"
    >
      {{ libraryState.importPhase === 'parsing' ? '' : 'Excel导入' }}
    </van-button>
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

.picker-wrap {
  flex: 1;
  min-width: 0;
}

.picker-wrap :deep(.van-dropdown-menu__bar) {
  box-shadow: none;
  height: 40px;
  background: transparent;
}

/* 门店下拉标题左对齐（sheet-switch spec 修订 7：下拉居左上角）——
   vant 菜单项默认 justify-content:center，单菜单项占满整栏时标题会落在屏幕中间 */
.picker-wrap :deep(.van-dropdown-menu__item) {
  justify-content: flex-start;
}

/* 标题去掉 vant 默认左内边距，与下方列表内容（12px）左缘对齐 */
.picker-wrap :deep(.van-dropdown-menu__title) {
  padding-left: 0;
}

/* 门店下拉字号放大（sheet-switch spec：当前项与选项清晰可读；真机反馈原字号太小）。
   依赖 Vant 内部类名，升级 vant 需回归真机确认 */
.picker-wrap :deep(.van-dropdown-menu__title) {
  font-size: 17px;
  font-weight: 500;
}

.picker-wrap :deep(.van-dropdown-item__option) {
  font-size: 16px;
}

/* 导入按钮宽度固定，防 loading 文案切换时顶栏抖动 */
.import-btn {
  flex-shrink: 0;
  min-width: 84px;
}
</style>
