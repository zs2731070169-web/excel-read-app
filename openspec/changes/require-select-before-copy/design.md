# Design: require-select-before-copy

## Context

当前底部操作栏的复制按钮是两态切换：未勾选 → 「复制当前列表」（直接复制全部）；有勾选 → 「复制选中（N）」。代码实现在 `allSelectedOrSelected()`：`selectedIndexes.size === 0` 时 fallback 到 `displayRows.value`（全部行）。

动机见 proposal.md - Why。本设计只处理「删未勾选 fallback + 按钮禁用」的实现方式。

## Goals / Non-Goals

**Goals:**
- 未勾选任何行时，复制按钮禁用（视觉灰态、不可点击）
- 有勾选时行为不变：复制选中行，文案「复制选中（N）」
- 删除 `allSelectedOrSelected()` 的 fallback 分支，复制入口只认勾选集合

**Non-Goals:**
- 不改 `formatRowText`/`copyTextToClipboard`（clipboard.ts 保留）
- 不改勾选框、全选框行为
- 不改长按自由选择

## Decisions

**D1：按钮禁用态用 `disabled` 属性 + 灰色样式，文案改为「请先勾选」。**
未勾选时 `van-button` 加 `disabled`，文案从「复制当前列表」改为「请先勾选」，视觉上明确告知用户需要先勾选。
- 替代方案 A：隐藏按钮（`v-if`）—— 拒绝，底部栏只剩全选框会显得失衡，且隐藏入口不如禁用入口直观。
- 替代方案 B：文案不变只加 disabled —— 拒绝，「复制当前列表」的语义暗示"有内容可复制"，与禁用态矛盾。

**D2：`allSelectedOrSelected()` 删除 fallback，简化为只返回勾选行。**
删除 `selectedIndexes.size === 0` 时的 `return displayRows.value`，函数只在 `size > 0` 时返回选中行。按钮 disabled 保证不会在空集合时被调用，但加防御性 `if (rows.length === 0) return` 保留。

**D3：价格列左对齐（CSS 微调，与本 change 同批次交付）。**
`.c-price` 加 `text-align: left`（ResultRow.vue + ResultList.vue 表头两处）。纯视觉修复，不涉 spec。

## Risks / Trade-offs

- **[复制全部多一步]** 复制全部需「全选 → 复制选中」，多一次点按。→ 已在 proposal 接受；全选框就在按钮左侧，操作连贯。
- **[文案「请先勾选」是否够清晰]** 手机小屏底部操作栏空间有限，四字文案已是最简。→ 实装后真机验证，不合适再调。
