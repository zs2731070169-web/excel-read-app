# Design: excel-order-search-app

## Context

全新空仓库，无既有代码约束。需求方为接单交付：客户（门店店员使用场景）需要一个安卓 App，导入多门店 Excel 工作簿后按商品名称/货架号搜索。数据样例已实测：首行表头「商品名称 / 条形码 / 货架号 / 价格」，每个 Sheet 一家门店，条形码可能为长数字（前导零、科学计数法风险）或含字母。

技术栈已与需求方（开发者）对齐：**Vue 3 + Vite + TypeScript + SheetJS + Vant 4 + Capacitor**，交付签名 APK。开发机为 macOS（Java 24 已装，Android SDK 需一次性安装，走本地代理 127.0.0.1:7892）。

## Goals / Non-Goals

**Goals:**
- 单页应用完成 导入 → 切页 → 搜索 → 复制 全流程，纯本地运行
- 数万行工作簿解析不卡 UI，结果即搜即得
- 在安卓 WebView 环境下保真：文件选择、长按复制、安全区、返回键
- 产物可复现构建：一键 `pnpm build` + Gradle 出签名 APK

**Non-Goals:**
- 无后端、无账号、无多设备同步（单机工具）
- 不监听原 Excel 文件变化（需求明确：改文档需手动重新导入）
- 不支持 Excel 公式计算、合并单元格语义展开（按单元格文本值读取）
- 不做 iOS / 桌面端（Electron 不适用，见 proposal 决策表）
- 不提供列映射配置界面（表头别名集合已覆盖客户实际格式）

## Decisions

### D1. 架构：单 Activity WebView 壳 + 纯前端 SPA

```
+---------------------------------------------------+
|  Android (Capacitor shell, MainActivity)          |
|  +---------------------------------------------+  |
|  |  WebView (dist/ 静态产物)                    |  |
|  |  +---------------------------------------+  |  |
|  |  | App.vue (单页，三块纵向区域)            |  |  |
|  |  |  [顶栏] SheetPicker + ImportButton      |  |  |
|  |  |  [搜索栏] Field + SearchButton          |  |  |
|  |  |  [结果区] 列表卡片 / 空状态             |  |  |
|  |  +---------------------------------------+  |  |
|  +---------------------------------------------+  |
+---------------------------------------------------+
```

状态管理不用 Pinia——单页面、单 store 纯属过度设计，用 `reactive()` 组合式状态 + composables 分层即可。

**分层：**
```
src/
  composables/useWorkbook.ts    # 状态: workbook/sheets/activeSheet/results
  services/excelParser.ts       # SheetJS 解析 + 表头识别 + 类型清洗
  services/persistence.ts       # IndexedDB 存取(防抖写)
  components/                   # TopBar / SearchBar / ResultList / ResultRow
  views/App.vue
```

*备选：Pinia* —— 放弃，理由同上。*备选：多路由* —— 无页面跳转需求。

### D2. Excel 解析：SheetJS，全部按格式化文本读取

- `XLSX.read(arrayBuffer, { type: 'array' })` 同时覆盖 `.xlsx` / `.xls`（CPA 唯一同时支持两格式的前端方案）
- `XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' })` —— **`raw: false` 是关键**：单元格取显示文本，长数字条形码不会变 `6.95312E+12`，前导零文本格式保留
- 表头识别：首行 trim 后按别名集合匹配（名称 `[商品名称,品名,名称]`、条形码 `[条形码,upc码,条码,upc]`、货架号 `[货架号,货架,架号]`、价格 `[价格,price]`），大小写不敏感；四列齐 → 合法，缺列 → 该 Sheet 标记 invalid（不阻断其他 Sheet）
- 数据行从第 2 行起；全空行跳过

*备选：Apache POI (Kotlin)* —— 原方案，开发效率低于前端路线，被需求方否决。*备选：easyexcel* —— JVM 生态，不适用。

### D3. 解析放 Web Worker

`new Worker(new URL('./excelWorker.ts', import.meta.url))`，主线程只收进度与结果。数万行 × 多 Sheet 时 `sheet_to_json` 单次可达百毫秒级，主线程执行会掉帧；Worker 内还可以按 Sheet 分批 `postMessage` 进度。

*备选：主线程 + requestIdleCallback* —— 首次导入仍有可感知卡顿，放弃。

### D4. 持久化：IndexedDB（非 localStorage）

- 结构：一个 db `excel-search`，store `workbook`（单记录：`{ fileName, importedAt, sheets: [{ name, valid, rows: OrderRow[] }] }`）+ store `ui-state`（`activeSheetName`）
- 数万行 × 4 字段 JSON 序列化后可达数 MB，localStorage 5MB 上限有溢出风险；IndexedDB 无此约束且结构化克隆更快
- 写入策略：导入完成一次性写入；启动时读取恢复；不监听文件变化
- 清空：`persistence.clearAll()` 一次事务删 workbook + ui-state 两 store，内存态复位；原文件本就不被引用，天然不受影响
- Vant 组件按需引入（`unplugin-vue-components`），结果区手写原生结构保 `user-select: text`

*备选：localStorage + JSON* —— 容量风险，仅作降级方案（不实现，捕获 QuotaExceeded 时提示重新导入）。

### D5. 复制交互：结果区脱离 Vant 渲染 + `user-select: text`

- 每行：`<div class="row">` 四个 `<span>`（原生），CSS `user-select: text; -webkit-user-select: text;`，长按呼出系统选择菜单
- Vant `Field`/`Cell` 全局样式含 `user-select: none` 主题变量——结果区组件**不使用** Vant 文本组件，并在全局样式重申 `:not()` 范围外的白名单
- 行内复制按钮：`navigator.clipboard.writeText`，WebView 内 fallback `document.execCommand('copy')`；拼接格式 `名称\t条形码\t货架号\t价格`（spec 已定 TAB 分隔）
- 复制成功用 Vant `showToast`

*备选：每字段单独长按菜单（Clipboard API 无部分选择语义）* —— 系统选择菜单本身就是自由选择，无需自研。

### D6. 搜索：前端内存过滤，按钮触发

- 状态机：`idle → (点击搜索) → searching(瞬时) → has-result / empty-result`；关键词或 activeSheet 变更 → 回 `idle`（watch 强制清空，spec「结果过期清空」）
- 匹配：`row.name.toLowerCase().includes(kw) || row.shelf.toLowerCase().includes(kw)`，输入框关键词同样 trim + toLowerCase；空关键词 toast 拦截
- 数据量上限内（数万行）同步 filter 耗时毫秒级，无需 Worker/索引

### D7. 打包：Capacitor 6/7 + Gradle（JDK 24 已具备）

- `npx cap add android` → `android/` 壳工程；`pnpm build && npx cap sync android`
- WebView 文件选择：安卓 WebView `<input type=file>` 由壳工程 `WebChromeClient.onShowFileChooser` 处理，Capacitor 已内置实现，`accept=".xlsx,.xls"` 声明过滤
- 安全区：`viewport-fit=cover` + `env(safe-area-inset-*)` + Vant `--van-safe-area` 变量
- 返回键：Capacitor App 插件 `backButton` 监听——键盘弹出时 WebView 默认先收键盘，无需自定义；其余情况 `App.exitApp()`
- 签名：`android/app/build.gradle` 配 keystore（交付前生成，密钥交客户）

*备选：uni-app 云打包* —— 源码需上传 DCloud 云端，接单项目源码隐私风险，放弃。*备选：Cordova* —— 维护活跃度与插件质量不如 Capacitor，放弃。

## Risks / Trade-offs

- **[.xls 格式边角]** SheetJS 对部分老 .xls（加密/宏表）可能解析失败 → 解析 try/catch，失败给「文件无法读取，请检查是否为加密或受损文件」明确提示，不崩溃
- **[科学计数法残留]** 少数 .xls 单元格在 Excel 里本身就显示为科学计数法文本（源头即坏）→ `raw:false` 忠实展示源头值，spec 层面接受（展示=源文件所见）
- **[IndexedDB 超大文件]** 单工作簿数百万行会撑爆存储 → 实际门店场景数百~数万行，风险低；捕获写入异常时降级为仅内存模式并提示
- **[WebView 剪贴板权限]** 部分安卓 WebView 版本对 `navigator.clipboard` 需 https 或受限 → execCommand fallback 已覆盖；真机验收场景列入 tasks
- **[Vant 主题变量泄漏到结果区]** user-select 被意外继承 → 用 E2E 手动验收场景兜底（长按选择），列入 tasks 检查项
- **[JDK 24 与 Gradle/AGP 兼容]** Capacitor 模板 Gradle 版本若不识别 JDK 24 → 备好 Gradle wrapper 升级或降级 JDK 17 两条路（Android Studio 自带 JBR 可直接用）

## Migration Plan

全新项目无迁移。首次交付流程：`pnpm install → pnpm build → npx cap sync android → gradle assembleRelease`（详细步骤在 tasks.md）。

## Open Questions

（无 —— 技术栈、交互、表结构均已与需求方确认闭环）
