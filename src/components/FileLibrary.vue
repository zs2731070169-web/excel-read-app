<script setup lang="ts">
import { showToast } from 'vant'
import { ref } from 'vue'
import { pickExcelFile } from '../services/excelPicker'
import { useLibrary } from '../composables/useLibrary'
import FileCard from './FileCard.vue'

const { state, importFile, openFile, deleteLibraryFile } = useLibrary()

/** 唯一展开删除态的文件 id */
const swipedId = ref<string | null>(null)
/** 删除确认弹窗（记录待删 id） */
const pendingDeleteId = ref<string | null>(null)
const importing = ref(false)

async function onImport() {
  if (importing.value) return // 阻止重复触发（spec: 解析期间不可重复导入）
  try {
    const picked = await pickExcelFile()
    if (!picked) return // 取消
    importing.value = true
    swipedId.value = null
    await importFile(picked.fileName, picked.arrayBuffer)
  } catch (err) {
    showToast(err instanceof Error ? err.message : '导入失败')
  } finally {
    importing.value = false
  }
}

function onSwipe(id: string | null) {
  swipedId.value = id
}

function onOpen(id: string) {
  swipedId.value = null
  void openFile(id)
}

function onRequestDelete(id: string) {
  pendingDeleteId.value = id
}

async function onConfirmDelete() {
  const id = pendingDeleteId.value
  pendingDeleteId.value = null
  if (!id) return
  await deleteLibraryFile(id)
  swipedId.value = null
  showToast('已删除（不影响手机上的原文件）')
}

/** 列表滚动时收起展开项（防误触） */
function onListScroll() {
  swipedId.value = null
}
</script>

<template>
  <div class="library">
    <!-- 顶栏：导入按钮（唯一操作入口，无清空） -->
    <header class="top-bar">
      <div class="title">我的文件</div>
      <van-button
        type="primary"
        size="small"
        :loading="state.importPhase === 'parsing' || importing"
        loading-text="解析中"
        @click="onImport"
      >
        {{ state.importPhase === 'parsing' || importing ? '' : 'Excel导入' }}
      </van-button>
    </header>

    <!-- 导入失败提示 -->
    <van-notify v-if="state.importPhase === 'error'" type="danger">
      {{ state.importError ?? '导入失败' }}
    </van-notify>

    <!-- 文件列表 -->
    <div class="list" @scroll.passive="onListScroll">
      <template v-if="state.files.length > 0">
        <FileCard
          v-for="file in state.files"
          :key="file.id"
          :file="file"
          :swiped-id="swipedId"
          @swipe="onSwipe"
          @open="onOpen"
          @delete="onRequestDelete"
        />
      </template>

      <!-- 空库引导 -->
      <div v-else class="empty">
        <p>还没有导入文件</p>
        <p class="hint">点击右上角「Excel导入」开始使用</p>
      </div>
    </div>

    <!-- 删除确认（唯一删除路径，无全局清空） -->
    <van-dialog
      :show="pendingDeleteId !== null"
      title="删除此文件"
      message="将从 App 文件库移除该文件及其数据，不影响手机上的原 Excel 文件。确定删除？"
      show-cancel-button
      confirm-button-text="删除"
      cancel-button-text="取消"
      @confirm="onConfirmDelete"
      @cancel="pendingDeleteId = null"
    />
  </div>
</template>

<style scoped>
.library {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f7f8fa;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  /* 顶边距 = 状态栏高度 + 24px 呼吸间距（与工作簿页一致） */
  padding-top: calc(24px + var(--safe-top));
  background: #fff;
  border-bottom: 1px solid #ebedf0;
}

.title {
  font-size: 17px;
  font-weight: 600;
  color: #323233;
}

.list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 12px 0 calc(16px + var(--safe-bottom));
}

.empty {
  padding: 64px 24px;
  text-align: center;
  color: #323233;
}

.empty .hint {
  margin-top: 8px;
  font-size: 13px;
  color: #969799;
}
</style>
