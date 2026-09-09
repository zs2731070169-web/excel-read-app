import { App as CapApp } from '@capacitor/app'
import { createApp } from 'vue'
import App from './App.vue'
import { restoreLibrary, useLibrary } from './composables/useLibrary'

// Vant 移动端基准样式（含 1px 边框、safe-area 处理）
import 'vant/lib/index.css'
import './styles/base.css'

// 启动恢复：读文件库，落在文件库页（file-library spec）
void restoreLibrary()

// 安卓返回键两层分派（app-packaging spec: 返回键行为）：
// 键盘弹出时系统 IME 先消费返回事件（收键盘，不进 JS）；到达此处即键盘未弹出。
const { closeWorkbook } = useLibrary()
CapApp.addListener('backButton', () => {
  const { state } = useLibrary()
  if (state.view === 'workbook') {
    closeWorkbook() // 工作簿页 → 回文件库
  } else {
    void CapApp.exitApp() // 文件库页（导航根）→ 退出
  }
}).catch(() => {
  /* Web 环境（浏览器预览）无此能力，忽略 */
})

createApp(App).mount('#app')
