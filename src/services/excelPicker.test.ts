import { describe, expect, it, vi } from 'vitest'
import { pickExcelFile } from './excelPicker'

/** 魔数预校验是 excelPicker 的核心防线（原生侧 MIME 被无视时兜底）。
 *  Web 降级路径走 input 元素无法在 node 环境测，原生路径走插件桥同样；
 *  可测部分：非 Excel base64（伪造非 PK/OLE2 头）在原生平台应抛错——
 *  通过 mock registerPlugin 的实现来测。 */
vi.mock('@capacitor/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@capacitor/core')>()
  return {
    ...actual,
    Capacitor: { ...actual.Capacitor, isNativePlatform: () => true },
    registerPlugin: () => ({
      pick: async () => ({
        fileName: 'fake.txt',
        // "hello" 的 base64——非 PK/OLE2 头
        base64: 'aGVsbG8=',
      }),
    }),
  }
})

vi.mock('@capacitor/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@capacitor/core')>()
  return {
    ...actual,
    Capacitor: { ...actual.Capacitor, isNativePlatform: () => true },
    registerPlugin: () => ({
      pick: async () => ({
        fileName: 'fake.txt',
        // "hello" 的 base64——非 PK/OLE2 头
        base64: 'aGVsbG8=',
      }),
    }),
  }
})

describe('excelPicker 预校验 (2.2)', () => {
  it('非 Excel 内容（坏魔数）抛明确错误', async () => {
    await expect(pickExcelFile()).rejects.toThrow('不是 Excel 文件')
  })
})
