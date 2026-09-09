<script setup lang="ts">
import { useLibrary } from './composables/useLibrary'
import FileLibrary from './components/FileLibrary.vue'
import ResultList from './components/ResultList.vue'
import SearchBar from './components/SearchBar.vue'
import TopBar from './components/TopBar.vue'

const { state } = useLibrary()
</script>

<template>
  <div class="app">
    <!-- 文件库首页（App 根视图） -->
    <FileLibrary v-if="state.view === 'library'" />

    <!-- 工作簿页（现有搜索界面复用） -->
    <template v-else>
      <TopBar />
      <SearchBar />
      <ResultList />
    </template>
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
</style>
