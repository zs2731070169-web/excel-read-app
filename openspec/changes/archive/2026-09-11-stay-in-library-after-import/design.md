# Design: stay-in-library-after-import

## Context

`useLibrary.onParsed` 现状：入库 → `refreshFiles()` → `openFile(id)`（自动跳工作簿）。此行为源自单文件时代，多文件库下与「连续导入」操作流冲突。

## Goals / Non-Goals

**Goals:** 导入成功停留文件库页，新文件置顶展示；失败行为不变
**Non-Goals:** 不改导入解析/持久化/文件选择链路；不改工作簿页任何行为

## Decisions

### D1. onParsed 移除自动打开
删除 `openFile(id)` 一行，保留 `refreshFiles()`（列表刷新出新文件）。成功反馈复用现有 toast「导入成功：N 个工作表」——它在 FileLibrary 的 onImport 里，本就渲染于文件库页上下文，无需挪动。

*备选：导入成功后短暂高亮新文件卡片* —— 视觉糖，不加（最小闭环）。

## Risks / Trade-offs

- 无。行为收敛为更少跳转，无数据与状态联动风险。

## Open Questions

（无）
