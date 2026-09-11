# Proposal: require-select-before-copy

## Why

当前底部操作栏的复制按钮在未勾选任何行时显示「复制当前列表」并直接复制全部行，绕过了勾选路径。用户决策：复制操作必须经过显式勾选，避免误触导致整表写入剪贴板；复制全部的唯一路径为「全选 → 复制选中（N）」。

## What Changes

- **BREAKING**：未勾选任何行时，复制按钮禁用（不可点击），文案保持「复制当前列表」或改为「请先勾选」等提示
- 删除 `result-copy` spec 中「复制当前列表」需求（未勾选时一键复制全部的能力不再提供）
- 修改 `result-copy` spec 中「勾选复制」需求：删除「未勾选任何行时为『复制当前列表』」的 fallback 语义，按钮仅在 `selectedIndexes.size > 0` 时可用

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `result-copy`: 删除「复制当前列表」需求；修改「勾选复制」需求，移除未勾选时 fallback 复制全部的语义，按钮未勾选时禁用

## Impact

- 代码：`src/components/ResultList.vue`（`allSelectedOrSelected()` 删除 fallback 分支、按钮加 `disabled` 绑定）
- 测试：ResultList 相关测试适配（按钮禁用态断言）
- 无数据结构 / 依赖变化
