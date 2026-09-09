# Tasks: multi-file-library

## 7. 复制格式精修（真机反馈）

- [x] 7.1 长按自由复制完整性：`ResultRow.vue` 复制按钮 `user-select:none`（选择排除按钮文字）、行内字段间插入真实空格（span 间文本节点）、行 div 保持块级换行；验证真机长按跨行复制到外部笔记：无按钮字样、字段单空格单行、行间换行
- [x] 7.2 「复制当前列表」按钮：`ResultList.vue` 底部操作，复制 displayRows 全部行（每行「名称 条形码 货架号 价格」单空格、行间 \n，复用整行复制的 clipboard+fallback 链路），成功提示含行数；空列表时隐藏；真机验证搜索/浏览两模式复制与外部粘贴格式

- [ ] 7.3 修复自由复制行内无分隔（真机反馈：按钮复制有分隔、自由复制粘连）：根因=模板 span 间空白文本节点被 Vue whitespace:'condense' 编译时移除，DOM 里从未有分隔符——改为显式 `<span class="sep">` 包裹真实 `&#9;`（font-size:0 不占可见宽，复制带上 TAB）；`formatRowText` 空格→TAB（两路径统一）；补 vue-test-utils 组件渲染断言 textContent 含 \t（组件层验证，不再只测状态机）；真机验证自由复制粘贴 TAB 分隔

## 6. 真机反馈修复（实现期回归）

- [x] 6.1 修复搜索框双清空按钮：`SearchBar.vue` 隐藏 WebView 原生 `::-webkit-search-cancel-button`（与 Vant clearable 叠加出现），验证真机仅一个 ✕
- [x] 6.2 工作簿页顶栏显示当前文件名（真机反馈：无法确认在哪个文件里，文件名相似易混淆），验证顶栏展示且超长省略
- [x] 6.3 **修复渲染冻结**：`ResultList.vue` 的 `displayRows`/`isBrowsing`、`SearchBar.vue` 的 `disabled` 均为 setup 一次性求值（真机症状：搜索/清空按钮"无反应"、搜索结果不切换）——全部改为 `computed()`；状态机层补「搜索后 has-result 状态下 displayRows 来源切换」断言；真机验证：搜索「倍力乐」出结果、点 × 回浏览模式、清空按钮生效
- [x] 6.4 浏览模式补真实文件回归夹具：`fixtures/extended.xlsx`（4 门店 × 101 行，倍力乐在尾部）纳入解析+搜索链路测试，验证尾部行不丢失

## 1. 数据层升级（schema v2 + 迁移）

- [x] 1.1 重构 `services/persistence.ts`：DB version 2，新 `files` store（keyPath id，记录含 id/fileName/firstImportedAt/importedAt/lastSheetName/workbook），提供 listFiles/getFile/putFile/deleteFile/clearFiles API，验证单测：增删查/倒序列表（firstImportedAt 排序）
- [x] 1.2 实现 v1→v2 迁移：onupgradeneeded 检测旧 workbook/ui-state store 记录 → 转 files 一条 → 删除旧 store；验证单测：预置 v1 数据（fake-indexeddb 建旧结构）→ 升级打开 → 断言 files 一条且字段完整、旧 store 不存在；迁移抛错时降级空库
- [x] 1.3 文件 id 规则：`fileName + 文件字节数` 稳定哈希；验证单测：同名同大小同 id（覆盖）、不同名不同 id

## 2. 原生文件选择桥

- [x] 2.1 实现 `ExcelPickerPlugin.java`（~60 行）：ACTION_OPEN_DOCUMENT + EXTRA_MIME_TYPES（xlsx/xls MIME）+ CATEGORY_OPENABLE，startActivityForResult → ContentResolver 读流 → 回传 {fileName, base64}；MainActivity 注册插件，验证 `assembleDebug` 编译通过
- [x] 2.2 JS 侧封装 `services/excelPicker.ts`：`pickExcelFile()` → Promise<{fileName, arrayBuffer}>（base64 解码，Uint8Array 直转，无拷贝放大）；非 Excel MIME 强选时按扩展名+魔数预校验拒绝并提示，验证单测：非法类型返回明确错误
- [x] 2.3 真机验证（debug 包）：点导入 → 系统选择器仅显示 Excel 文件；从下载目录选取 .xlsx 与 .xls 均能取回文件名与内容（真机 2NSDU20415033958 验证：微信 Download/WeiXin 目录 xlsx 选取成功）

## 3. 状态机分层

- [x] 3.1 新建 `composables/useLibrary.ts`：view('library'|'workbook')/files 列表/openFile/closeWorkbook/importFile(接 Worker 解析→putFile→自动打开)/deleteFile；启动时 listFiles 恢复，验证单测：导入→列表更新→打开→关闭→删除→空态 全链路状态流转
- [x] 3.2 改造 `useWorkbook.ts`：由 openFile(fileId, workbookData, lastSheetName) 注入会话（选中 sheet 恢复 lastSheetName），删除全局 restore/clearImportedData（职责移至 useLibrary）；现有 search/switchSheet/setKeyword 逻辑与测试保持通过（适配注入式初始化）
- [x] 3.3 逐文件删除联动：删除当前打开文件时自动 closeWorkbook；同名重导覆盖（put 同 id，firstImportedAt 保留、importedAt 更新），验证单测覆盖两个场景

## 4. UI 两层视图

- [x] 4.1 新建 `components/FileLibrary.vue` + `FileCard.vue`：列表（Excel 图标/文件名/导入日期）+ **左滑展开/右滑收回红色删除按钮**（跟手 translateX + 平滑落位、同时仅一项展开、点击他处收回）、空态引导、顶栏（导入按钮）、删除确认弹窗（无全局清空入口），验证：滑动交互流畅性真机走查 + file-library spec 全场景
- [x] 4.2 改造 `TopBar.vue` 按视图渲染：工作簿页=返回入口+sheet 下拉（无导入按钮）；导入按钮触发 excelPicker（替换 input[type=file]），验证两视图顶栏内容正确切换
- [x] 4.3 改造 `App.vue`：view 切换文件库页/工作簿页（现有 SearchBar/ResultList 仅工作簿页渲染），导入中 loading 与失败 toast 在两视图均可用，验证：启动落文件库、进入工作簿、返回恢复列表
- [x] 4.4 返回键两层化：`main.ts` backButton 按 view 分派（workbook→closeWorkbook，library→exitApp），真机验证：工作簿页返回回库、库页返回退出、键盘先收起

## 5. 收尾与交付

- [x] 5.1 全量回归：`pnpm test` 全绿（新用例 + 既有 30 用例适配后通过）、`pnpm build`、`assembleDebug`，真机走查 file-library/excel-import/sheet-switch/app-packaging 全部 delta 场景
- [x] 5.2 更新 README（新交互说明、勿混装旧版提示、类型过滤说明），出新的签名 release APK 并 `apksigner verify`，勾选全部任务后对照 `openspec validate --strict` 通过
