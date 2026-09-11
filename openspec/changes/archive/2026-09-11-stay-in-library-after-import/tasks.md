# Tasks: stay-in-library-after-import

## 1. 行为修改与验证

- [ ] 1.1 `useLibrary.ts` onParsed 移除 `openFile(id)` 自动进入，导入成功停留文件库页（toast 已有）；useLibrary 测试适配（导入后 view 保持 library、文件列表含新文件）；真机验证：导入 → 停留列表页新文件置顶 → 连续导第二个 → 手动点击进入工作簿正常
