import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { TABLE_COLUMNS } from '../components/tableColumns'

/**
 * 列几何唯一事实源守卫（2026-09-13「价格 title 与数字列错位」修复的补强）：
 * happy-dom 无布局引擎，DOM 结构镜像测试（ResultList.test.ts）测不到 CSS 层——
 * 组件 scoped 单侧覆写 width/gap、table.css 列宽失衡、main.ts 漏引样式，
 * 都会让错位以「测试全绿」的方式复发（审查篡改实验实证）。本文件用源码级
 * 断言补上这一层：几何只允许存在于 table.css，且与 TABLE_COLUMNS 逐列对应。
 */

/** 读取源码文件文本（相对本测试文件定位，不依赖运行 cwd） */
function readSource(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf-8')
}

/** 从 table.css 提取指定选择器的规则块内容（不含花括号） */
function ruleBlockOf(cssSource: string, selector: string): string {
  const match = cssSource.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`))
  if (!match) throw new Error(`table.css 缺少 ${selector} 规则块`)
  return match[1]
}

/** 从 table.css 提取 .c-<key> 列宽度百分比（缺声明即抛错） */
function columnWidthPercent(key: string): number {
  const block = ruleBlockOf(tableCss, `.c-${key}`)
  const widthMatch = block.match(/width:\s*(\d+(?:\.\d+)?)%/)
  if (!widthMatch) throw new Error(`table.css 的 .c-${key} 缺少百分比宽度声明`)
  return Number(widthMatch[1])
}

const tableCss = readSource('./table.css')

describe('列几何唯一事实源（table.css）', () => {
  it('TABLE_COLUMNS 每列都有 .c-<key> 宽度声明，且总和恰为 100%', () => {
    // 求和超出 100% 会引发 flex 溢出收缩回归（错位修复前的既有形态）
    const total = TABLE_COLUMNS.reduce((sum, column) => sum + columnWidthPercent(column.key), 0)
    expect(total).toBe(100)
  })

  it('.table-line 行骨架含 flex / gap / 水平 padding（两容器几何一致的前提）', () => {
    const block = ruleBlockOf(tableCss, '.table-line')
    expect(block).toContain('display: flex')
    expect(block).toContain('gap: 8px')
    expect(block).toContain('padding-left: 12px')
    expect(block).toContain('padding-right: 12px')
  })

  it('.sep 宽度置零（TAB 分隔参与布局但不占可见宽度）', () => {
    expect(ruleBlockOf(tableCss, '.sep')).toContain('font-size: 0')
  })

  it('main.ts 引入 table.css（漏引则全部几何失效）', () => {
    expect(readSource('../main.ts')).toContain('./styles/table.css')
  })
})

describe('组件侧不得私设列几何（防两侧分叉）', () => {
  // 错位根因的样式面：scoped 选择器特异性高于全局 .c-*，单侧覆写只影响数据行
  // 不影响表头，正是「两侧几何分叉」的静默复活路径
  it.each([
    ['ResultList.vue（表头）', '../components/ResultList.vue'],
    ['ResultRow.vue（数据行）', '../components/ResultRow.vue'],
  ])('%s 的 scoped 样式无 width/gap 声明', (_name, relativePath) => {
    const source = readSource(relativePath)
    const styleBlocks = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1])
    expect(styleBlocks.length).toBeGreaterThan(0)
    for (const block of styleBlocks) {
      // 先剥掉 CSS 注释，避免注释中的词（如「flex/gap/padding-inline」）误报
      const declarationsOnly = block.replace(/\/\*[\s\S]*?\*\//g, '')
      expect(
        declarationsOnly.match(/\b(?:width|gap)\s*:/),
        `${relativePath} scoped 内出现几何声明，列几何只允许在 src/styles/table.css`,
      ).toBeNull()
    }
  })
})
