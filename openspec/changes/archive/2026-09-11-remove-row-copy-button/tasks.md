# Tasks: remove-row-copy-button

## 1. TDD 先行（测试断言适配，先红）

- [ ] 1.1 改 `src/components/ResultRow.test.ts`：`tabs[3]` 断言由 `toContain(sample.price)` 改为 `toBe(sample.price)`，删除 `expect(wrapper.find('.copy-btn').exists()).toBe(true)` 断言，并运行 `pnpm test` 确认当前为红（按钮文字「复制」仍混入尾段，`toBe(price)` 失败）

## 2. 实现：删行内按钮与列宽重分配

- [ ] 2.1 `src/components/ResultRow.vue`：删除 `copyRow()` 函数、`<button class="c-op copy-btn">` 元素、`.c-op`/`.copy-btn` 样式，删除不再使用的 `copyTextToClipboard`/`formatRowText`/`showToast` import，并将 `.c-price` 宽度由 11% 改为 22%

- [ ] 2.2 `src/components/ResultList.vue`：删除表头空占位单元格 `<span class="c-op"></span>` 与 `.c-op { width: 11% }` 样式，并将表头 `.c-price` 宽度由 11% 改为 22%

## 3. 回归验证

- [ ] 3.1 运行 `pnpm test` 确认全量测试转绿（`ResultRow.test.ts` 的 `toBe(price)` 通过，其余用例不回归）

- [ ] 3.2 运行 `pnpm build`（vue-tsc 类型检查 + vite build）确认无未使用 import 或类型错误
