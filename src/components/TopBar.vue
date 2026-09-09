<script setup lang="ts">
import { showToast } from 'vant'
import { computed, ref } from 'vue'
import { useWorkbook } from '../composables/useWorkbook'

const { state, sheetNames, importFile, clearImportedData, switchSheet } = useWorkbook()

const fileInput = ref<HTMLInputElement | null>(null)
const showClearDialog = ref(false)
const importing = computed(() => state.phase === 'parsing')
const imported = computed(() => state.workbook !== null)

/** 下拉框选项：Sheet 名 + 无效标记（格式不符的 Sheet 可见但提示） */
const options = computed(() =>
  sheetNames.value.map((name) => {
    const sheet = state.workbook?.sheets.find((s) => s.name === name)
    return { text: sheet?.valid === false ? `${name}（格式不符）` : name, value: name }
  }),
)

function onPickFile() {
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 允许重复选择同一文件（改文档后重新导入）
  if (!file) return
  await importFile(file)
  if (state.phase === 'done') {
    showToast(`导入成功：${state.workbook?.sheets.length ?? 0} 个工作表`)
  } else if (state.phase === 'error') {
    showToast(state.importError ?? '导入失败')
  }
}

function onSelectSheet(name: string) {
  switchSheet(name)
}

async function onConfirmClear() {
  showClearDialog.value = false
  await clearImportedData()
  showToast('已清空导入数据')
}
</script>

<template>
  <header class="top-bar">
    <!-- 左：工作表下拉（未导入时禁用，sheet-switch spec） -->
    <div class="picker-wrap" :class="{ disabled: !imported }">
      <van-dropdown-menu v-if="imported" :close-on-click-overlay="true">
        <van-dropdown-item
          :model-value="state.activeSheetName ?? ''"
          :options="options"
          @change="onSelectSheet"
        />
      </van-dropdown-menu>
      <div v-else class="picker-placeholder">未导入文档</div>
    </div>

    <div class="actions">
      <!-- 清空入口：未导入时隐藏（excel-import spec） -->
      <van-icon
        v-if="imported"
        name="delete-o"
        size="20"
        class="clear-btn"
        @click="showClearDialog = true"
      />
      <van-button
        type="primary"
        size="small"
        :loading="importing"
        loading-text="解析中"
        @click="onPickFile"
      >
        {{ importing ? '' : 'Excel导入' }}
      </van-button>
    </div>

    <!-- 真实文件选择：accept 限定 Excel 类型（app-packaging spec: 类型过滤） -->
    <input
      ref="fileInput"
      type="file"
      accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
      hidden
      @change="onFileChange"
    />

    <!-- 清空确认弹窗（不可逆操作防误触） -->
    <van-dialog
      v-model:show="showClearDialog"
      title="清空导入数据"
      message="将删除已导入的全部数据，需重新导入才能继续使用。手机上的 Excel 原文件不受影响。确定清空？"
      show-cancel-button
      confirm-button-text="清空"
      cancel-button-text="取消"
      @confirm="onConfirmClear"
    />
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  /* 顶边距 = 状态栏高度 + 24px 呼吸间距（真机两轮目测调整定稿） */
  padding-top: calc(24px + var(--safe-top));
  background: #fff;
  border-bottom: 1px solid #ebedf0;
}

.picker-wrap {
  flex: 1;
  min-width: 0;
}

.picker-wrap.disabled .picker-placeholder {
  color: #c8c9cc;
  padding: 0 12px;
  line-height: 48px;
}

/* Vant dropdown 菜单条背景适配顶栏 */
.picker-wrap :deep(.van-dropdown-menu__bar) {
  box-shadow: none;
  height: 40px;
  background: transparent;
}

.actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.clear-btn {
  color: #969799;
  padding: 6px;
}
</style>
