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
    <!-- 当前文件名（用户反馈：无法确认在哪个文件里） -->
    <div class="file-name" :title="state.workbook?.fileName">
      {{ state.workbook?.fileName }}
    </div>

    <!-- 门店（工作表）下拉：中部占满剩余宽度 -->
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

.file-name {
  flex-shrink: 0;
  max-width: 30vw;
  font-size: 13px;
  color: #969799;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
