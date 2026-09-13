## 1. 视图状态机与导入链路（useLibrary）

- [x] 1.1 重写 `useLibrary.test.ts` 视图流转用例（先红后绿）：启动恢复直达最近导入文件（view=workbook、activeFileId=最新记录）、无文件启动落空态（view=empty）、`startImport` 导出存在且解析期间防重复触发；删除 closeWorkbook / deleteLibraryFile / 停留文件库相关旧用例，运行 `pnpm test` 确认新用例失败
- [x] 1.2 实现 `useLibrary.ts`：`LibraryView` 改 `'empty' | 'workbook'`、移除 `state.files`、恢复逻辑取 `listFiles()` 首条直接 `openFile`、新增 `startImport()`（迁移 FileLibrary.onImport 的防重/选取/错误提示）、`onParsed` 入库后直接 `openFile(id)`、删除 `closeWorkbook` / `deleteLibraryFile` 导出，运行 `pnpm test` 确认 1.1 用例全绿

## 2. 页面结构重组（App / TopBar / 空态 / 返回键）

- [x] 2.1 删除 `FileLibrary.vue`、`FileCard.vue`，`App.vue` 重构为「empty 空态导入引导（内联）+ workbook（TopBar/SearchBar/ResultList）」两分支，空态含导入按钮（绑 startImport、解析中 loading）；`TopBar.vue` 移除返回箭头与 closeWorkbook 引用，右侧新增「Excel 导入」按钮（绑 startImport、loading 绑 importPhase）；`main.ts` 返回键监听收敛为直接 `CapApp.exitApp()`；全局搜索确认无 FileLibrary/FileCard/closeWorkbook 残留引用（`pnpm build` 的 vue-tsc 通过即验证）
- [ ] 2.2 真机/浏览器冒烟（pnpm dev）：无文件启动见空态引导 → 导入文件直达数据列表页 → 再次导入另一文件直接切换 → 取消选取无变化 → 解析失败有提示且页面可用

## 3. 一键复制当前列表（ResultList / ResultRow）

- [x] 3.1 在 `services/clipboard.ts` 下沉纯函数 `joinRowsText(rows)`（TAB 分隔 + 行间换行）并补单测（多行拼装、字段顺序、空数组），先写测试后实现，`pnpm test` 验证
- [x] 3.2 更新 `ResultRow.test.ts`（先红）：删除勾选框/选中态断言，新增「无复选框节点、TAB 结构与四字段文本不变」断言；更新 `ResultList.test.ts` 补一键复制用例（mock clipboard，断言复制内容 = 当前 displayRows 拼装、提示含行数），运行确认失败
- [x] 3.3 实现 `ResultRow.vue`（去 selected/index props、toggle emit、复选框与 .checked 样式）与 `ResultList.vue`（删 selectedIndexes/watch/allSelected/toggle*，`copyCurrentList` 调 `joinRowsText`，按钮文案 `复制 N 条` 恒可用，表头删勾选列格），`pnpm test` 全绿
- [ ] 3.4 真机/浏览器冒烟：浏览态复制 = 当前门店全部行（TAB 分隔）、搜索态复制 = 匹配行、空列表无操作栏、复制成功提示含行数

## 4. 样式可用性修复（SearchBar / TopBar / ResultRow）

- [x] 4.1 `SearchBar.vue` 搜索按钮 `size="normal"` + `min-width: 72px`（保留 flex-shrink:0 与间距防误触结构）；`TopBar.vue` 下拉当前项字号 17px/字重 500、选项 16px（:deep 覆盖并注释依赖的 Vant 类名）；`ResultRow.vue` 与表头四列宽度调整为 32/29/15/24，`.c-name` 改单行省略（nowrap + hidden + ellipsis，去 word-break）；`pnpm test` 与 `pnpm build` 通过验证无回归
- [ ] 4.2 真机/浏览器冒烟：搜索按钮可轻松点中、门店下拉当前项与选项清晰可读、超长商品名称单行省略且复制内容仍为全名

## 5. 回归与收尾

- [ ] 5.1 全量回归：`pnpm test` 全绿 + `pnpm build`（vue-tsc + vite）零错误，确认无未接线代码（死代码、未调用导出、过时注释）——结合代码审查清单逐项过
- [ ] 5.2 对照 delta specs 逐场景核验（excel-import 六场景 / file-library 移除 / order-search 省略场景 / result-copy 一键复制四场景 / sheet-switch 三场景 / app-packaging 三场景），记录核验结果后执行两阶段代码审查并清理问题
