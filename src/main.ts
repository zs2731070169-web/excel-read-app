import { App as CapApp } from '@capacitor/app'
import { createApp } from 'vue'
import App from './App.vue'
import { restore } from './composables/useWorkbook'

// Vant 移动端基准样式（含 1px 边框、safe-area 处理）
import 'vant/lib/index.css'
import './styles/base.css'

// 启动恢复：读 IndexedDB 上次导入数据（excel-import spec: 重启不重导）
void restore()

// 安卓返回键（app-packaging spec）：键盘弹出时系统 IME 先消费返回事件（收起键盘），
// 事件不会到达此处；到达此处即键盘未弹出 → 退出应用。Web 预览下该插件为 no-op。
CapApp.addListener('backButton', () => {
  void CapApp.exitApp()
}).catch(() => {
  /* Web 环境（浏览器预览）无此能力，忽略 */
})

createApp(App).mount('#app')
