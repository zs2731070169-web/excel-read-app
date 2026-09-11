<div align="center">

# 📊 Excel 订单搜索

**门店商品/订单查询安卓工具**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Android-3ddc84.svg)](#)
[![Capacitor](https://img.shields.io/badge/capacitor-8.5-9feaf9.svg)](https://capacitorjs.com/)
[![Vue](https://img.shields.io/badge/vue-3.5-42b883.svg)](https://vuejs.org/)

</div>

导入手机上的 Excel 工作簿（.xlsx / .xls），按门店（工作表）浏览全部记录，或按**商品名称 / 货架号**搜索，勾选后一键复制（TAB 分隔，粘贴到 Excel/WPS 自动分列）。

---

## ✨ 功能特性

- **Excel 导入**：选择手机上的 .xlsx / .xls 文件导入，每个工作表识别为一个门店
- **文件库管理**：已导入文件列表展示，左滑删除（不影响原文件），同名重导自动覆盖
- **浏览与搜索**：按门店浏览全部记录，或按商品名称 / 货架号搜索
- **勾选复制**：勾选记录后一键复制，粘贴到 Excel 自动分列
- **长按复制**：长按文字自由选择范围复制

---

## 📦 安装

### 下载 APK 安装（推荐）

将 `excel读取.apk` 传到安卓手机，开启**允许安装未知来源应用**后安装即可。

### 从源码构建

```bash
# 1. 克隆项目
git clone <repo-url>
cd excel-read-app

# 2. 安装依赖
pnpm install

# 3. 构建前端产物
pnpm build

# 4. 同步到安卓壳工程
npx cap sync android

# 5. 构建签名 APK
cd android && ./gradlew assembleRelease
# 产物: android/app/build/outputs/apk/release/app-release.apk
```

> 调试版：`./gradlew assembleDebug`，产物在 `apk/debug/` 下。

---

## 🔑 签名配置

首次构建需配置：

1. `android/local.properties`：`sdk.dir=<你的 Android SDK 路径>`
2. `keystore.properties`（不入库）：
   ```properties
   storeFile=../excel-search-release.keystore
   storePassword=<密码>
   keyAlias=excel-search
   keyPassword=<密码>
   ```

> ⚠️ **丢失 keystore = 无法再对同一应用发升级版**，务必离线备份。

---

## 🗸️ 技术架构

```
excel-read-app/
├── src/
│   ├── components/           # Vue 组件
│   │   ├── FileLibrary.vue   # 文件库首页
│   │   ├── FileCard.vue      # 文件卡（左滑删除）
│   │   ├── TopBar.vue        # 顶栏（返回/门店下拉/导入）
│   │   ├── SearchBar.vue     # 搜索栏
│   │   ├── ResultList.vue    # 结果区 + 底部操作栏
│   │   └── ResultRow.vue     # 单行记录
│   ├── composables/          # 组合式函数
│   │   ├── useLibrary.ts     # 文件库状态机
│   │   └── useWorkbook.ts    # 工作簿状态机
│   ├── services/             # 业务逻辑
│   │   ├── excelParser.ts    # Excel 解析（SheetJS）
│   │   ├── excelPicker.ts    # 文件选择器桥接
│   │   ├── excelWorker.ts    # Web Worker 异步解析
│   │   ├── clipboard.ts      # 剪贴板写入
│   │   ├── persistence.ts    # IndexedDB 持久化
│   │   └── types.ts          # 数据模型
│   ├── styles/               # 全局样式
│   └── main.ts               # 应用入口
├── android/                  # Capacitor 安卓壳工程
├── openspec/                 # SDD 规格产物
└── dist/                     # 前端构建产物
```

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [Vue 3](https://vuejs.org/) | 响应式 UI 框架 |
| [Vite 8](https://vitejs.dev/) | 构建工具 |
| [TypeScript 5](https://www.typescriptlang.org/) | 类型安全 |
| [SheetJS](https://sheetjs.com/) | Excel 解析 |
| [Vant 4](https://vant-ui.github.io/vant/) | 移动端 UI 组件库 |
| [Capacitor 8](https://capacitorjs.com/) | WebView 壳 + 原生桥接 |
| [Vitest 5](https://vitest.dev/) | 单元测试 |
| [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB) | 本地持久化 |

---

## 📝 开发

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 浏览器开发（http://localhost:5173） |
| `pnpm test` | Vitest 单元测试 |
| `pnpm build` | vue-tsc 类型检查 + 产物构建 |

---

## 📄 License

MIT

---

<div align="center">
  <sub>Made with ❤️</sub>
</div>
