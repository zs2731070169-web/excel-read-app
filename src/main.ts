import { createApp } from 'vue'
import App from './App.vue'
import { restore } from './composables/useWorkbook'

// Vant 移动端基准样式（含 1px 边框、safe-area 处理）
import 'vant/lib/index.css'
import './styles/base.css'

// 启动恢复：读 IndexedDB 上次导入数据（excel-import spec: 重启不重导）
void restore()

createApp(App).mount('#app')
