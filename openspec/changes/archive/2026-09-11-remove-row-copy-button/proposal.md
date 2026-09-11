# Proposal: remove-row-copy-button

## Why

结果区每行的「复制」按钮是勾选复制（7.6 一体化底部操作栏）落地前的遗留入口：精确格式复制主路径已由「全选 + 复制当前列表/复制选中（N）」承接，行内按钮成为冗余视觉噪音，且其单行语义与勾选复制重复。删除以简化结果行布局。

## What Changes

- 移除每条结果行价格字段之后的「复制」按钮（`ResultRow.vue` 中 `.copy-btn`），结果行仅保留勾选框 + 四字段（名称/条形码/货架号/价格）
- 移除结果区表头末端的空占位单元格（`.c-op`），释放的宽度重新分配给价格列
- 删除 `result-copy` 规格中的「单行一键复制」需求（SHALL 级需求删除）

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `result-copy`: 删除「单行一键复制」需求（每条结果行 SHALL 提供复制按钮）。单行复制能力改由勾选该行后点击「复制选中（1）」承接，与既有「勾选复制」需求语义合并。

## Impact

- 代码：`src/components/ResultRow.vue`（删 `copyRow()`、按钮元素、`.c-op`/`.copy-btn` 样式及 `copyTextToClipboard`/`formatRowText`/`showToast` import）
- 代码：`src/components/ResultList.vue`（删表头空单元格 `.c-op`、删 `.c-op { width: 11% }`、价格列宽度重新分配）
- 测试：`src/components/ResultRow.test.ts`（删 `.copy-btn` 存在断言；`tabs[3]` 断言由 `toContain(price)` 改为 `toBe(price)`）
- 无数据结构 / 依赖变化（`src/services/clipboard.ts` 的 `formatRowText`/`copyTextToClipboard` 仍由 ResultList 使用，保留不动）
