## Context

现有导航为两层视图：`useLibrary.state.view: 'library' | 'workbook'`，`library` 渲染 `FileLibrary`（含 FileCard 左滑删除），`workbook` 渲染 `TopBar + SearchBar + ResultList`；导入链路 `pickExcelFile → importFile → Worker 解析 → onParsed 入库 → 停留文件库`；复制链路为勾选集合（`ResultList.selectedIndexes` + `ResultRow` 复选框 + 底部全选/复制操作栏）。本变更推翻三个已归档决策的 UI 行为：stay-in-library-after-import（改为导入直达）、multi-file-library 的列表 UI（改为直达最近文件）、require-select-before-copy（改为一键复制当前列表）。持久层 `services/persistence.ts` 的多文件模型**不动**。见 proposal.md - Why。

## Goals / Non-Goals

**Goals:**

- 导入/冷启动直达数据列表页，页面结构从「文件库 + 工作簿」收敛为「空态引导 + 工作簿」
- 复制路径从勾选集合简化为「一键复制当前列表」，复制产物格式（TAB + 换行）与反馈完全不变
- 三项样式可用性修复：搜索按钮触控区、门店下拉字号、商品名称超长省略

**Non-Goals:**

- 不为「切换历史文件 / 删除文件」设计新入口（数据保留在 IndexedDB，同名同大小重导自动覆盖）
- 不改 `services/` 任何模块（persistence / excelParser / clipboard / excelPicker / worker）
- 不改 `useWorkbook.ts` 会话与搜索状态机逻辑
- 不引入双击返回确认、手势导航适配等新交互

## Decisions

### D1 视图状态机：`'library'` → `'empty'`

`LibraryView` 改为 `'empty' | 'workbook'`。`restoreLibrary()` 重命名为语义准确的启动恢复：`listFiles()` 取第一条（现有排序 `firstImportedAt` 倒序 = 最近导入）直接 `openFile(id)`；无文件则 `view = 'empty'`。`state.files` 数组从全局状态移除——文件库页删除后无消费者，恢复逻辑内部局部变量即可。
*备选*：保留 `files` 以备未来文件切换器——违反最小闭环，删。

### D2 导入链路收敛到 `useLibrary.startImport()`

`FileLibrary.onImport` 的逻辑（防重复、选取、错误 toast）整体迁入 `useLibrary` 新导出 `startImport(): Promise<void>`，组件只剩按钮绑定。`onParsed` 完成入库后直接 `await openFile(id)`（含覆盖重导场景：同名记录覆盖后重新注入会话，数据即时刷新）。TopBar 与空态页两个按钮共用该入口，loading 统一绑 `state.importPhase === 'parsing'`，错误提示维持 van-notify / toast（在 startImport 内 showToast，空态页补 notify 展示）。
*备选*：在两个组件里各写一份 onImport——重复且防重状态不同步，弃。

### D3 删除文件库相关代码与导出

删除 `FileLibrary.vue`、`FileCard.vue`；`useLibrary` 移除导出 `closeWorkbook`、`deleteLibraryFile`（UI 无入口即死代码）。`TopBar` 移除返回箭头与 `closeWorkbook` 调用，右侧新增导入按钮。`App.vue` 空态分支内联实现（van-empty 风格引导文案 + 导入按钮），不新建组件——仅一个按钮，最小闭环。

### D4 一键复制当前列表

`ResultList` 删除 `selectedIndexes` / `watch` 清空 / `allSelected` / `toggleRow` / `toggleSelectAll`，`copyMainAction` 改名 `copyCurrentList`：`rows = displayRows`（computed 已统一搜索/浏览两态），空列表时操作栏本身不渲染（现有 `v-if`），按钮恒可用、文案 `复制 N 条`。`ResultRow` 删除 `selected` / `index` props、`toggle` emit、复选框与 `.checked` 样式；TAB 分隔 span 结构原样保留（长按复制与格式保真的来源）。表头 `.c-check-h` 格删除。

### D5 列宽重分配与商品名称省略

勾选列（22px）释放后四列宽度：商品名称 28%→32%、条形码 27%→29%、货架号 14%→15%、价格 22%→24%（表头与行同步）。`.c-name` 由 `word-break: break-all` 改为 `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`。关键事实：`text-overflow` 只裁显示不裁 DOM 文本，长按系统选择与一键复制仍取到完整名称（order-search delta 的「数据层完整」由此保证）。条形码列已是单行布局，维持不动。

### D6 搜索按钮加宽

`van-button` 由 `size="small"`（高 24px）改 `size="normal"`（高 32px，与输入胶囊视觉等高），并加 `min-width: 72px`，保留 `flex-shrink: 0` 与现有间距防误触结构。纯样式，无状态变化。

### D7 门店下拉字号放大

TopBar 内 `:deep(.van-dropdown-menu__title) { font-size: 17px; font-weight: 500; }`；展开选项经 `van-dropdown-item` 的 option 渲染，`:deep(.van-dropdown-item__option)` 文字放大至 16px。集中在 TopBar scoped 样式并注释依赖的 Vant 类名（升级风险点）。

### D8 安卓返回键收敛为退出

`main.ts` 的 `backButton` 监听去掉 `view` 分派，键盘未弹出时直接 `CapApp.exitApp()`（键盘仍由系统 IME 层先消费，注释保留该两层说明）。`closeWorkbook` 删除后此监听不再依赖 useLibrary。

### D9 测试策略（等价路径沿用）

- `useLibrary.test.ts`：重写视图流转场景——启动直达最近文件（导入两个文件后 restore，断言 view=workbook 且 activeFileId=较新者）、无文件启动空态、`startImport` API 与解析中防重（Worker 在 node 不可用，沿用现有「等价路径 + 真机覆盖 done 分支」策略）；删除 closeWorkbook / deleteLibraryFile / 停留文件库相关用例
- `ResultRow.test.ts`：勾选断言替换为「无复选框节点 + TAB 结构不变」
- `ResultList.test.ts`：displayRows 计算保留，补一键复制纯逻辑（mock clipboard 服务断言拼装文本与行数）——复制函数若留在组件内难以单测，将「rows → 文本」拼装下沉为可测纯函数放 `services/clipboard.ts`（`joinRowsText(rows)`），组件只做调用与 toast
- 真机冒烟清单（apply 阶段人工）：导入直达、冷启动直达、返回键退出、复制格式、下拉字号、长名称省略

## Risks / Trade-offs

- [返回键在数据列表页直接退出，误触即离 App] → 与原「文件库页（导航根）返回键退出」行为一致，未引入新风险；如真机反馈误触多，后续变更补「再按一次退出」toast，不进本闭环
- [多文件数据在 UI 层不可达，长期堆积占存储] → 采纳为已知取舍：同名同大小覆盖是主更新路径；需要清理时以新变更补管理入口（file-library delta 已记录 Migration 说明）
- [`state.files` 移除后未来做文件切换器要加回] → 加回成本低（一行 `listFiles()`），不为假设需求保留状态
- [:deep 覆盖 Vant 内部类名（下拉字号）在 Vant 升级时可能失效] → 样式集中 + 注释标注依赖类名；升级时跑真机冒烟
- [商品名称省略后用户在屏上看不到全名] → 数据层完整：一键复制含全名；长按选择亦可取全名；列宽已从 28% 加宽到 32%

## Migration Plan

无数据迁移：IndexedDB schema（v2 多文件）不变，旧数据在冷启动直接被 openFile 消费。APK 覆盖安装即生效；回滚 = 回退到上一版本 APK（旧版仍读同一份数据，文件库页照常展示）。
