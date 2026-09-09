import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.hariku.excelordersearch',
  appName: 'Excel订单搜索',
  webDir: 'dist',
  android: {
    // 允许 WebView 长按文本选择/复制（result-copy spec）
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'https', // navigator.clipboard 需安全上下文（design D5）
  },
}

export default config
