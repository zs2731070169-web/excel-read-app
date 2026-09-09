# Tasks: excel-order-search-app

## 1. 项目脚手架

- [x] 1.1 初始化 Vite + Vue 3 + TypeScript 项目（`pnpm create vite`），清理模板代码，验证 `pnpm dev` 启动空白页正常
- [x] 1.2 安装依赖：`vant`、`xlsx`、`@capacitor/core`、`@capacitor/cli`、`@capacitor/android`、`@capacitor/app`、`@capacitor/status-bar`，配置 Vant 按需引入（`unplugin-vue-components`），验证 `pnpm build` 产物生成
- [x] 1.3 配置移动端基线：`viewport-fit=cover` viewport meta、safe-area CSS 变量、中文 UI 文案默认字体，验证浏览器移动模拟器下无横向滚动

## 2. Excel 解析层

- [ ] 2.1 实现 `services/excelParser.ts`：SheetJS `read(arrayBuffer)` + `sheet_to_json({ header:1, raw:false, defval:'' })`，验证对样例 .xlsx 与 .xls（可用 SheetJS 写测试夹具）均能读出文本矩阵
- [ ] 2.2 实现表头别名识别（名称/条形码/货架号/价格四组别名，大小写不敏感、trim），返回每 Sheet 的 valid 标记与列索引映射，验证：标准表头、别名 UPC码、乱序、缺列 四个用例通过
- [ ] 2.3 实现数据行清洗：第 2 行起、全空行跳过、四字段文本化，验证长数字（13+ 位）与前导零、含字母条形码在解析结果中保持文本原样
- [ ] 2.4 解析层单元测试（Vitest）：覆盖 2.1–2.3 全部验证点 + 损坏文件抛错 + 空工作表返回空数组，`pnpm test` 全绿

## 3. Web Worker 与持久化

- [ ] 3.1 实现 `services/excelWorker.ts`：Worker 内调用解析层，按 Sheet postMessage 进度，主线程 `composables/useWorkbook.ts` 接收状态（idle/parsing/done/error），验证导入万行级测试文件时 UI 不冻结、进度正常上报
- [ ] 3.2 实现 `services/persistence.ts`：IndexedDB `excel-search` 库（workbook 单记录 + ui-state），导入完成写入、启动读取恢复（含 activeSheetName），验证刷新页面后数据与所选 Sheet 恢复、写入异常时降级仅内存并提示
- [ ] 3.3 持久化集成测试：导入 → 刷新 → 断言工作表列表/数据/选中态一致；重新导入同文件 → 断言新数据完全覆盖

## 4. UI 实现

- [ ] 4.1 实现顶栏（`components/TopBar.vue`）：左 `van-dropdown-menu` 工作表选择、右「Excel 导入」按钮（`<input type=file accept=".xlsx,.xls">` 隐藏触发），未导入时下拉禁用显示「未导入文档」，验证：初始态、导入成功自动选第一个 Sheet、切换 Sheet 生效
- [ ] 4.2 实现搜索栏（`components/SearchBar.vue`）：`van-field` + 「搜索」按钮，IME search 键触发，空关键词 toast 拦截，验证：按钮触发、键盘触发、输入过程不自动过滤
- [ ] 4.3 实现结果区（`components/ResultList.vue` + `ResultRow.vue`）：原生 div/span 渲染（不用 Vant 文本组件）、`user-select: text`、列序固定「商品名称/条形码/货架号/价格」、空结果与未搜索两种空态，验证场景对齐 order-search spec（名称/货架号匹配、大小写、无结果提示）
- [ ] 4.4 实现结果过期清空：watch 关键词与 activeSheet 变更回置 idle 并清结果，验证：改词后旧结果消失并提示重新搜索、切 Sheet 后清空、点 × 清空回初始态
- [ ] 4.5 实现复制：行长按系统选择（真机/WebView 验证）+ 每行复制按钮（`navigator.clipboard` + `execCommand` fallback，TAB 拼接四字段）+ 成功 toast，验证复制到剪贴板内容与 spec 格式一致
- [ ] 4.6 实现清空导入数据：顶栏清空图标（未导入时隐藏/禁用）+ `van-dialog` 确认，确认后 `persistence.clearAll()` 并复位全部状态，验证三个场景：确认清空回初始态、取消无变化、原 Excel 文件不受影响

## 5. Capacitor 安卓壳

- [ ] 5.1 `npx cap init` + `npx cap add android`，`capacitor.config.ts` 配 appId/appName/webDir，验证 `android/` 工程生成且 Gradle wrapper 可用（必要时经代理 127.0.0.1:7892 装 Android SDK/JBR）
- [ ] 5.2 处理安卓返回键：键盘弹出时默认收起、其余 `App.exitApp()`（`@capacitor/app` backButton），验证真机：聚焦搜索框按返回先收键盘、再按退出
- [ ] 5.3 真机联调（`npx cap run android`）：文件选择器唤起与选文件导入、长按复制可用、安全区无遮挡，逐项对照 app-packaging spec 验收场景

## 6. 构建交付

- [ ] 6.1 生成 keystore 并配置 `android/app/build.gradle` 签名，`gradle assembleRelease` 出签名 APK，验证 `apksigner verify` 通过
- [ ] 6.2 编写 README：构建步骤（install/build/sync/assemble）、代理注意事项、密钥保管说明，验证新环境按文档可复现构建
- [ ] 6.3 端到端验收：真机安装签名 APK，按四个能力 spec 全场景走查（导入/切页/搜索/复制/重启恢复/格式不符提示），结果记录回本 change 并对照 openspec validate --strict 通过
