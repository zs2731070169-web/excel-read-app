# Proposal: excel-order-search-app

## Why

门店店员需要在手机上快速查询商品所在的货架号与价格，但目前商品数据以 Excel 工作簿（每家门店一个工作表）形式流转，手机上无法便捷查询。需要交付一个安卓 App：导入 Excel 后，按商品名称或货架号搜索当前门店工作表中的订单记录，并支持自由复制内容。

## What Changes

- 新建安卓 App 项目（Vue 3 + Vite + TypeScript + SheetJS + Vant 4 + Capacitor，交付签名 APK）
- 支持「Excel 导入」：通过系统文件选择器选取 `.xlsx` / `.xls` 文件并解析（文档有修改需重新导入）
- 支持文档页（工作表）切换：顶部下拉框列出全部工作表（门店），未导入时禁用
- 支持搜索：按商品名称或货架号，在当前选中工作表范围内做不区分大小写的包含匹配；**显式搜索按钮 / 键盘搜索键触发**（方案 B），关键词或工作表变更后清空旧结果
- 支持结果展示与复制：每条记录展示商品名称、条形码（UPC）、货架号、价格；长按自由选择文字复制 + 每行一键复制
- 解析结果本地持久化：App 重启后无需重新导入；仅在用户重新导入时覆盖
- 支持清空导入数据：顶栏图标入口 + 确认弹窗，确认后删除本地数据回到未导入初始态，不影响手机上的 Excel 原文件
- 后台异步解析 + 进度反馈；表头按别名集合识别（条形码/UPC码/条码/UPC 等同义词），任一必需列缺失时报「文档格式不符」

### 已确认的关键决策（源自需求探索对话）

| 决策点 | 定论 |
|---|---|
| 表头结构 | 首行表头：商品名称 / 条形码 / 货架号 / 价格（客户样例实测，条形码非「UPC码」字面） |
| 工作表语义 | 每个 Sheet = 一家门店（样例：江店1、德江店2、思南店、沿河店…） |
| 顶栏布局 | 下拉框在左（状态），导入按钮在右（操作） |
| 搜索触发 | 方案 B：显式按钮 + IME 搜索键；变更后清空结果 |
| 条形码读取 | 按文本原样读取（SheetJS `raw: false`），保留前导零、禁止科学计数法 |
| 技术栈 | Vue 3 + Vite + TypeScript + SheetJS + Vant 4 + Capacitor → 签名 APK |
| 非 Electron | 打包用 Capacitor（移动端 WebView 壳），Electron 仅面向桌面端 |

## Capabilities

### New Capabilities

- `excel-import`: Excel 文件选取、导入、解析、校验与错误反馈，解析结果持久化
- `sheet-switch`: 工作表（门店）列表展示与切换，未导入状态的禁用与引导
- `order-search`: 按商品名称/货架号搜索当前工作表，方案 B 显式触发与结果过期清空
- `result-copy`: 搜索结果展示、长按自由选择复制、单行一键复制
- `app-packaging`: Capacitor 安卓壳工程、WebView 运行时适配（安全区、文件选择、复制行为）与签名 APK 交付

### Modified Capabilities

（无 —— 全新项目，无既有规格）

## Impact

- **代码**：全新仓库内容 —— `src/`（Vue 应用）、`android/`（Capacitor 壳工程）、根配置（package.json、vite.config.ts、capacitor.config.ts）
- **依赖**：vue@3、vant@4、xlsx（SheetJS）、@capacitor/core / @capacitor/android / @capacitor/cli、@capacitor/file-picker（或系统 WebView input[type=file]）
- **构建**：本机需一次性安装 Android SDK（走本地代理），Gradle 出签名 APK
- **无后端**：纯本地单机应用，无网络请求、无账号体系
