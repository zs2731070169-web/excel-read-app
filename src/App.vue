<script setup lang="ts">
import { useLibrary } from './composables/useLibrary'
import ResultList from './components/ResultList.vue'
import SearchBar from './components/SearchBar.vue'
import TopBar from './components/TopBar.vue'

const { state, startImport } = useLibrary()
</script>

<template>
  <div class="app">
    <!-- 启动恢复完成前不渲染任何视图（避免 IndexedDB 读取期间空态闪帧） -->
    <template v-if="state.restored">
      <!-- 无文件：导入引导空态（文件库页移除后的唯一非工作簿视图） -->
      <div v-if="state.view === 'empty'" class="import-guide">
        <p class="guide-title">还没有导入文件</p>
        <p class="guide-hint">导入 Excel 商品表后直接开始查询</p>
        <!-- loading 态置空默认插槽：vant loading 中改显 loading-text，置空防双文案叠加 -->
        <van-button
          type="primary"
          class="import-btn"
          :loading="state.importPhase === 'parsing'"
          loading-text="解析中"
          @click="startImport"
        >
          {{ state.importPhase === 'parsing' ? '' : 'Excel导入' }}
        </van-button>
      </div>

      <!-- 数据列表页（工作簿页） -->
      <template v-else>
        <TopBar />
        <SearchBar />
        <ResultList />
      </template>
    </template>

    <!-- 导入失败提示（全局唯一错误展示位，空态/工作簿两视图共用）。
         MUST 绑 :show——vant Notify 的 show 默认 false，仅 v-if 不渲染节点（审查实证）；
         importPhase 在下次导入开始时复位，提示随之消失 -->
    <van-notify :show="state.importPhase === 'error'" type="danger">
      {{ state.importError ?? '导入失败' }}
    </van-notify>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #f7f8fa;
}

.import-guide {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 24px calc(32px + var(--safe-bottom));
}

.import-guide .guide-title {
  font-size: 16px;
  color: #323233;
}

.import-guide .guide-hint {
  margin-bottom: 16px;
  font-size: 13px;
  color: #969799;
}

.import-guide .import-btn {
  min-width: 132px;
}
</style>
