<div align="center">

<img src="assets/icon/excel-tool-icon.png" width="128" alt="Excel订单搜索" />

# 📊 Excel 订单搜索

**门店商品/订单查询安卓工具**

<img src="assets/badges/platform-android.svg" alt="Platform: Android" />
<a href="https://vuejs.org/"><img src="assets/badges/vue.svg" alt="Vue: 3.5" /></a>
<a href="https://capacitorjs.com/"><img src="assets/badges/capacitor.svg" alt="Capacitor: 8.5" /></a>
<img src="assets/badges/license-mit.svg" alt="License: MIT" />

</div>

> 本项目采用 OpenSpec（SDD 规格层）+ Claude Code（工程纪律层）双层工作流开发，需求规格与设计产物见 `openspec/`。

> 主链路为「导入 Excel → 按门店浏览 / 搜索 → 长按复制」。数据全部存储于手机本地（IndexedDB），不上传任何服务器。

---

## ✨ 功能特性

### 📥 导入 Excel
- **直接选取**：从微信 / QQ 下载的 .xlsx / .xls 表格直接导入，无需转换
- **智能识别**：只需「商品名称 / 条形码 / 货架号 / 价格」四列，列顺序不限，表头写法兼容常见叫法（如「条码 / UPC码」）
- **数字完整**：条形码不丢前导零、不变科学计数法，价格不带货币符号
- **容错导入**：大文件不卡顿，损坏或选错的文件会被拦下提示，不影响已有数据

### ⚡ 直达数据页
- **导入即达**：导入成功直接进入数据列表页，无需经过任何文件列表
- **启动直达**：重新打开 App 自动进入最近导入的文件，拿来就用
- **本地保存**：数据存在手机本地，重启不丢失
- **同名覆盖**：改完表格重新导入同名文件，数据自动更新

### 🗂 浏览与搜索
- **门店切换**：工作表即门店，下拉切换，自动记忆上次浏览的门店
- **浏览模式**：不搜索时按表格原顺序展示当前门店全部记录
- **按需搜索**：输入商品名称或货架号，点「搜索」查询，仅限当前门店

### 📋 长按复制
- **自由选取**：长按任意文字唤起系统选择菜单，单字段、跨字段、跨行自由选取复制
- **行内分隔**：行内 TAB 分隔随选择尽力保留，粘贴 Excel / WPS 可自动分列

### 📱 安卓适配
- **全面屏适配**：刘海 / 挖孔屏与手势导航下内容不被遮挡
- **返回键分派**：键盘弹出时先收起键盘，再按直接退出应用（数据页即首页）

---

## 📦 安装与运行

### 方式一：直接安装 APK（推荐）

将 `excel读取.apk` 传到安卓手机，开启**允许安装未知来源应用**后安装即可。

> 首次启动进入导入引导页，点「Excel 导入」开始使用。卸载 App 会清空全部导入数据，手机原 Excel 文件不受影响。

### 方式二：从源码构建

环境前置：

| 依赖 | 要求 |
|------|------|
| Node.js + pnpm | 请使用 pnpm（仓库含 `pnpm-lock.yaml`） |
| JDK | Amazon Corretto OpenJDK 24 实测可用 |
| Android SDK | compileSdk 36 / minSdk 24 |
| `android/local.properties` | Android Studio 打开工程自动生成 |

```bash
# 1. 克隆项目
git clone <repo-url>
cd excel-read-app

# 2. 安装依赖
pnpm install

# 3. 构建与同步
pnpm build && npx cap sync android

# 4. 打包 APK
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/excel读取.apk
```

> 调试版：`./gradlew assembleDebug`；安装到设备：`./gradlew installDebug`。

---

## 🔑 签名配置

`keystore.properties`（不入库）配置 release 签名，缺失时构建产出未签名 APK（无法安装）。

```properties
storeFile=../excel-search-release.keystore   # 相对 android/ 目录
storePassword=<密码>
keyAlias=excel-search
keyPassword=<密码>
```

> ⚠️ keystore 文件丢失将无法发布升级版，务必离线备份。

---

## 🏗️ 技术架构

```
excel-read-app/
├── src/
│   ├── components/           # Vue 组件
│   │   ├── TopBar.vue        # 顶栏（门店切换 / 导入）
│   │   ├── SearchBar.vue     # 搜索栏
│   │   ├── ResultList.vue    # 结果列表 + 操作栏
│   │   └── ResultRow.vue     # 单行记录
│   ├── composables/          # 组合式函数
│   │   ├── useLibrary.ts     # 全局视图与导入状态
│   │   └── useWorkbook.ts    # 工作簿状态
│   ├── services/             # 业务逻辑
│   │   ├── excelParser.ts    # Excel 解析
│   │   ├── excelPicker.ts    # 文件选择
│   │   ├── excelWorker.ts    # Web Worker 异步解析
│   │   ├── clipboard.ts      # 剪贴板写入
│   │   ├── persistence.ts    # 本地持久化
│   │   └── types.ts          # 数据模型
│   ├── styles/base.css       # 全局样式
│   └── main.ts               # 入口
├── android/                  # 安卓壳工程
├── assets/                   # 图标与徽章
├── openspec/                 # 需求规格
└── dist/                     # 构建产物
```

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [Vue 3](https://vuejs.org/) | UI 框架 |
| [Vite](https://vite.dev/) | 构建工具 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [SheetJS](https://sheetjs.com/) | Excel 解析 |
| [Vant 4](https://vant-ui.github.io/vant/) | 移动端组件库 |
| [Capacitor 8](https://capacitorjs.com/) | 安卓原生桥接 |
| Web Worker | 后台解析 |
| IndexedDB | 本地存储 |

---

## 📝 开发指南

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 浏览器开发（localhost:5173） |
| `pnpm test` | 单元测试 |
| `pnpm build` | 生产构建 |
| `npx cap sync android` | 同步前端产物到安卓工程 |
| `npx cap open android` | 打开 Android Studio |

> 浏览器即可调试主链路，安卓返回键在 Web 环境自动忽略。

---

## 📄 License

MIT

---

<div align="center">
  <sub>Made with ❤️ · Excel 订单搜索</sub>
</div>
