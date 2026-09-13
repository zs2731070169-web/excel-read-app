import { App as CapApp } from '@capacitor/app'
import { createApp } from 'vue'
import App from './App.vue'
import { restoreLibrary } from './composables/useLibrary'

// Vant 移动端基准样式（含 1px 边框、safe-area 处理）
import 'vant/lib/index.css'
import './styles/base.css'

// 启动恢复：直接进入最近导入文件的工作簿页（无文件落导入引导空态）
void restoreLibrary()

// 安卓返回键（app-packaging spec: 返回键行为）：
// 键盘弹出时系统 IME 先消费返回事件（收键盘，不进 JS）；到达此处即键盘未弹出——
// 数据列表页与空态页均为导航根（文件库页已移除），直接退出应用。
CapApp.addListener('backButton', () => {
  void CapApp.exitApp()
}).catch(() => {
  /* Web 环境（浏览器预览）无此能力，忽略 */
})

createApp(App).mount('#app')
