# excel-read-app

三层工作流：**OpenSpec（SDD 规格层）+ Superpowers（TDD 执行层）+ Claude Code Harness（工程纪律层）**。

## 分层职责

| 层 | 工具 | 职责 | 产物 |
|---|---|---|---|
| SDD | OpenSpec（`/opsx:*`） | 需求事实源：对齐"做什么" | `openspec/changes/<change>/`（proposal / design / specs / tasks） |
| TDD | Superpowers（`superpowers:*` 技能） | 实现"怎么做好"：TDD、代码审查、系统化调试 | `docs/superpowers/specs/` 设计文档、`docs/superpowers/plans/` 实现计划 |
| Harness | Claude Code + git | 执行环境与纪律：分支隔离、小步提交、验证后收尾 | 代码 + 提交历史 |

## 标准工作流（六阶段）

1. **Open**：`/opsx:propose "需求描述"` → 生成 proposal、delta specs、design、tasks
2. **Design**：读取 change 全部产物，用 superpowers `brainstorming` 做深度技术设计 → Design Doc 存入 `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`（frontmatter 标注 `change:` 与 `canonical_spec: openspec`）；发现缺失验收场景时只回写 OpenSpec delta spec，不另立需求
3. **Plan**：superpowers `writing-plans` 基于设计文档生成计划 → `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`（frontmatter 含 `change:`、`design-doc:`、`base-ref:`）
4. **Build**：每个 change 一个分支（`git checkout -b <change-name>`），superpowers `subagent-driven-development` 逐任务实现，强制 TDD + 两阶段代码审查；每完成一个任务在 tasks.md 勾选并提交
5. **Verify**：`/opsx:archive` 前对照 spec 验证全部场景；superpowers `verification-before-completion` + `finishing-a-development-branch` 收尾
6. **Archive**：`/opsx:archive <change>` 归档，delta spec 同步进主 spec

## 硬性纪律

- OpenSpec 是需求唯一事实源：不重写 proposal/spec，改动需求走 `/opsx:update`
- 小改动走捷径：bug 修复直接 systematic-debugging + TDD，文案/配置微调直接改，不强制开 change
- 新增任务超过初始任务数 50% 时，拆分为新 change
- 所有规格/设计/任务产物用中文书写，保留 SHALL/MUST 关键字为英文（见 `openspec/config.yaml`）
- 未验证不说完成：测试失败就报告失败，跳过的步骤要明说

## 目录约定

```
openspec/changes/<change>/   # SDD 产物（活跃）
openspec/changes/archive/    # SDD 产物（已归档）
openspec/specs/              # 主 spec（能力维度）
docs/superpowers/specs/      # 技术设计文档
docs/superpowers/plans/      # 实现计划
```
