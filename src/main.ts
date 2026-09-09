import { createApp } from 'vue'
import App from './App.vue'

// Vant 移动端基准样式（含 1px 边框、safe-area 处理）
import 'vant/lib/index.css'
import './styles/base.css'

createApp(App).mount('#app')
