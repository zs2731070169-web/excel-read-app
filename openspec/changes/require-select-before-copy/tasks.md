# Tasks: require-select-before-copy

## 1. 实现：按钮禁用 + fallback 删除 + 价格左对齐

- [ ] 1.1 `src/components/ResultList.vue`：`allSelectedOrSelected()` 删除 fallback 分支（删 `return displayRows.value`），改为空集合时返回空数组；`van-button` 加 `:disabled="selectedIndexes.size === 0"`，文案由 `selectedIndexes.size > 0 ? '复制选中（N）' : '复制当前列表'` 改为 `selectedIndexes.size > 0 ? '复制选中（N）' : '请先勾选'`

- [ ] 1.2 `src/components/ResultRow.vue`：`.c-price` 加 `text-align: left`

- [ ] 1.3 `src/components/ResultList.vue`：表头 `.c-price` 加 `text-align: left`

## 2. 回归验证

- [ ] 2.1 运行 `pnpm test` 确认全量测试转绿

- [ ] 2.2 运行 `pnpm build` 确认无类型错误
