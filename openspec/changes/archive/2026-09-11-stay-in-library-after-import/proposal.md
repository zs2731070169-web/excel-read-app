# Proposal: stay-in-library-after-import

## Why

多文件库形态下，「导入成功后自动跳进工作簿页」是从单文件时代延续的行为：连续导入多个文件时每导一个都被拽进记录列表、需返回再导，打断操作流。用户决策：导入后停留文件库页，由用户自行点击进入。

## What Changes

- 导入成功后不再自动进入工作簿页：留在文件库页，新文件出现在列表顶部，toast 反馈成功（含工作表数量）
- 导入失败行为不变（留在文件库页报错提示）

## Capabilities

### Modified Capabilities

- `excel-import`: 「Excel 文件选取与导入」场景中「自动进入该文件的工作簿页」改为「停留文件库页，新文件出现在列表顶部，用户自行进入」

## Impact

- 代码：`src/composables/useLibrary.ts`（onParsed 移除 openFile 调用，~1 行）
- 测试：useLibrary 流转断言适配（view 保持 library）
- 无数据结构/依赖变化
