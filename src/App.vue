<script setup lang="ts">
import ResultList from './components/ResultList.vue'
import SearchBar from './components/SearchBar.vue'
import TopBar from './components/TopBar.vue'
import { useWorkbook } from './composables/useWorkbook'

const { state } = useWorkbook()
</script>

<template>
  <div class="app">
    <TopBar />
    <SearchBar />
    <!-- 解析中整屏 loading（excel-import spec: 进度反馈 + 阻止重复导入由按钮 loading 态保证） -->
    <div v-if="state.phase === 'parsing'" class="parsing">
      <van-loading size="28px" vertical>正在解析文档…</van-loading>
    </div>
    <ResultList v-else />
    <!-- 持久化降级提示（design D4: 写失败仅内存模式） -->
    <van-notify v-if="state.persistenceDegraded" type="warning">
      本地保存失败，重启后需重新导入
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

.parsing {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
