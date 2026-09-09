import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'

export default defineConfig({
  plugins: [
    vue(),
    // importStyle:false —— 测试环境不注入 vant 组件样式导入（node 链路无法加载 css）
    Components({ resolvers: [VantResolver({ importStyle: false })] }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // 组件测试（happy-dom 环境）经 unplugin 自动导入 vant 组件时连带注入 css，
    // node 测试链路无法解析 —— css 一律 stub 为空（测试不验证样式内容）
    css: false,
  },
})
