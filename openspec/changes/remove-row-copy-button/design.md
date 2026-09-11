# Design: remove-row-copy-button

## Context

结果行（`ResultRow.vue`）当前结构：勾选框 + 四字段（名称/条形码/货架号/价格）+ 行内「复制」按钮。字段间以 `<span class="sep">{{ '\t' }}</span>` 注入字面 TAB（`font-size:0` 不占可见宽、复制带分隔），行 div 保持 `user-select:text` 支持长按自由选择。复制能力有三条路径：行内按钮（单行一键复制）、底部操作栏（勾选复制 / 复制当前列表）、长按自由选择。

动机见 proposal.md - Why。本设计只处理「删行内按钮」的实现方式与列宽重分配，不改复制格式（TAB 分隔定稿）与勾选复制语义。

## Goals / Non-Goals

**Goals:**
- 删除行内「复制」按钮及其独占的 `.c-op` 列，结果行回归「勾选框 + 四字段」的干净布局
- 释放的列宽归价格列，保持四列总占比不变（91%），其余列视觉不动

**Non-Goals:**
- 不改 `formatRowText`/`copyTextToClipboard`（`src/services/clipboard.ts` 仍被 `ResultList.copyMainAction` 使用，保留）
- 不动底部一体化操作栏（全选 + 复制当前列表/复制选中（N））
- 不动长按自由选择的 `user-select` 与 TAB 分隔结构

## Decisions

**D1：删按钮与 `copyRow()`，保留勾选框与四字段。**
`ResultRow.vue` 移除 `copyRow()` 函数、`<button class="c-op copy-btn">` 元素、`.c-op`/`.copy-btn` 样式，以及因此不再使用的三个 import（`copyTextToClipboard`、`formatRowText`、`showToast`）。勾选框（`emit('toggle')`）、四字段、`.sep` TAB 分隔、`.row` 的 `user-select:text` 全部保留。
- 替代方案：仅隐藏按钮（`v-if="false"`）—— 拒绝，留死代码违背最小闭环。

**D2：价格列宽度 11% → 22%（释放的 `.c-op` 11% 全归价格列）。**
行内 `.c-op { width: 11% }` 与表头 `.c-op { width: 11% }` 一并删除；`.c-price` 由 11% 提到 22%。四列总占比 28+27+14+22 = 91%，与原 91% 持平，其余三列（名称/条形码/货架号）宽度不变。
- 替代方案 A：按比例均摊到四列 —— 拒绝，改动面更大且无明确收益。
- 替代方案 B：价格保持 11%、其余列均摊 —— 拒绝，价格是红色重点字段（`#ee0a24`），放宽后数字更完整展示，受益最大。

**D3：`src/services/clipboard.ts` 保留不动。**
`formatRowText` 与 `copyTextToClipboard` 仍被 `ResultList.vue` 的 `copyMainAction` 使用（`rows.map(formatRowText).join('\n')` + `copyTextToClipboard`），删按钮后非死代码，无需改动。

**D4：表头空占位单元格同步删除。**
`ResultList.vue` 表头第 88 行 `<span class="c-op"></span>` 是行内按钮列的对齐占位，随按钮一起删除；其 `.c-op { width: 11% }` 样式（第 173 行）同步删除，表头 `.c-price` 同样提到 22%。

## Risks / Trade-offs

- **[单行复制从一键变两步]** 删按钮后，复制单条记录需「勾选 → 复制选中（1）」，多一次点按。→ 已在 proposal 接受；「复制当前列表」仍一键覆盖最常见的整表复制，单条精确复制走勾选路径。
- **[测试误改风险]** `ResultRow.test.ts` 的 `tabs[3]` 断言当前是 `toContain(price)`（因 `textContent` 尾段混入按钮文字「复制」）；删按钮后尾段只剩价格，须改为 `toBe(price)`，并同步删除 `.copy-btn` 存在断言。→ 回归关注点写入 tasks.md。
- **[列宽回归]** `.c-price` 与 `.c-op` 宽度在 `ResultRow.vue` 与 `ResultList.vue` 两处各有一份，须同步改，漏一处会列错位。→ 两处统一提到 22% / 删除 `.c-op`。
