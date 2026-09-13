## Why

真机使用反馈：高频路径是「导入 → 查询 → 复制」，但当前交互存在多余中转与冗余步骤——导入成功后停在文件库页，还需再点一次文件才能看到数据；复制前必须逐条勾选（搜索 → 勾选 → 复制三步）；另有搜索按钮触控区过窄、门店下拉字号过小、超长商品名称换行撑高行导致列表拥挤等可读性问题。本变更把使用路径压缩到最短，并修复样式层面的可用性缺陷。

## What Changes

- **BREAKING** 移除文件库页（`FileLibrary` / `FileCard`）：
  - 导入成功后直接进入该 Excel 的数据列表页（工作簿页），不再停留文件库
  - 冷启动有文件时直接进入最近导入文件的数据列表页；无文件时展示导入引导空态
  - 「Excel 导入」入口从文件库页迁移到工作簿页顶栏（解析中 loading，防重复触发）；无文件空态页同样提供导入入口
  - 移除「返回文件库」交互（顶栏返回箭头、安卓返回键回库）；工作簿页成为导航根，返回键退出应用
  - 移除多文件列表与左滑删除 UI；IndexedDB 多文件持久化模型保留（同名同大小重导仍覆盖），仅去掉 UI 层
- **BREAKING** 移除勾选复制（底部全选框 + 每行复选框）：复制按钮改为一键复制当前列表（搜索态 = 当前搜索结果，浏览态 = 当前门店全部记录）；TAB 分隔 + 行间换行的复制格式与成功反馈不变；长按自由选择复制保留
- 搜索按钮加宽（扩大触控区，方便点击）
- 顶栏工作表（门店）下拉当前项与选项字号放大，清晰可读
- 商品名称列超长时单行省略号截断，不再换行撑高；勾选列移除后四列列宽重新分配

## Capabilities

### New Capabilities

（无——本变更全部为既有能力的修改与移除）

### Modified Capabilities

- `excel-import`: 导入入口位置改变（文件库页 → 工作簿页顶栏 / 无文件空态页）；导入成功后由「停留文件库页」改为「直接进入该文件工作簿页」；重启恢复由「落在文件库页」改为「直接进入最近导入文件的工作簿页」
- `file-library`: 能力整体移除（文件库首页、进入工作簿跳转、滑动删除、逐文件删除的 UI 层全部下线）
- `order-search`: 搜索结果行的商品名称列超长时单行省略号截断（数据层仍完整，复制内容不受影响）；结果表头移除勾选列
- `result-copy`: 「勾选复制」需求移除，替换为「一键复制当前列表」（底部操作栏仅保留复制按钮，始终可点，复制当前展示的全部行）；WebView 长按复制保留，其「精确格式」表述改指向一键复制
- `sheet-switch`: 顶栏布局改变——移除返回入口，「Excel 导入」按钮出现在工作簿页顶栏右侧（原「MUST NOT 出现在工作簿页」约束反转）；下拉当前项与选项 SHALL 以放大字号展示
- `app-packaging`: 返回键行为改变——工作簿页为导航根，键盘收起后返回键退出应用（原「工作簿页返回文件库」路径移除）

## Impact

- **前端组件**：`src/App.vue`（视图分支重构 + 无文件空态）、`src/components/FileLibrary.vue` 与 `FileCard.vue`（删除）、`TopBar.vue`（去返回箭头 + 导入按钮迁移）、`SearchBar.vue`（按钮加宽）、`ResultList.vue`（去勾选体系 + 一键复制）、`ResultRow.vue`（去复选框 + 名称省略 + 列宽）
- **状态层**：`src/composables/useLibrary.ts`（视图状态机 `'library'` → 无文件空态 / 工作簿两态、启动恢复直达、导入完成自动 openFile、closeWorkbook/deleteLibraryFile 导出移除）；`useWorkbook.ts` 会话逻辑不变
- **入口**：`src/main.ts`（安卓返回键分派简化为退出应用）
- **测试**：`useLibrary.test.ts`（视图流转场景重写）、`ResultRow.test.ts`（勾选断言移除）、`ResultList.test.ts`（复制逻辑补充）
- **不受影响**：`services/`（persistence 多文件模型、excelParser、clipboard、excelPicker）、excelWorker、解析与搜索逻辑
- **规格同步**：归档时 6 个主 spec 按 delta 更新；此前已归档的 stay-in-library-after-import、multi-file-library（UI 层）、require-select-before-copy 三个变更的行为被本变更显式推翻
