import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx'
import { parseWorkbook } from '../services/excelParser'
import { clearFiles, fileIdentity, getFile, putFile } from '../services/persistence'
import { resetWorkbookSession, state as workbookState, switchSheet } from './useWorkbook'
import { restoreLibrary, startImport, state } from './useLibrary'

// vant / 原生选择器在 node 链路不可用 —— mock 后只验证状态流转（沿用 ResultRow.test 的做法）
vi.mock('vant', () => ({ showToast: vi.fn() }))
vi.mock('../services/excelPicker', () => ({ pickExcelFile: vi.fn() }))
import { showToast } from 'vant'
import { pickExcelFile } from '../services/excelPicker'

/** 构造双门店工作簿字节（沿河店 / 江店1） */
function makeWorkbookBytes(): ArrayBuffer {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['商品名称', '条形码', '货架号', '价格'],
      ['可乐', '6901', 'A1', '3'],
    ]),
    '沿河店',
  )
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['商品名称', '条形码', '货架号', '价格'],
      ['雪碧', '6902', 'B1', '3.5'],
    ]),
    '江店1',
  )
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
}

/**
 * 直接入库一条文件记录（node 等价路径，绕过 Worker——importFile 的 Worker
 * 解析链路在 node 不可用，done→直达工作簿分支由真机冒烟覆盖）。
 * firstImportedAt 显式指定，保证「最近导入」排序可断言。
 */
async function seedFile(
  fileName: string,
  firstImportedAt: number,
  lastSheetName: string | null = null,
): Promise<string> {
  const bytes = makeWorkbookBytes()
  const workbook = parseWorkbook(bytes, fileName)
  const id = fileIdentity(fileName, bytes.byteLength)
  await putFile({ id, fileName, firstImportedAt, importedAt: firstImportedAt, lastSheetName, workbook })
  return id
}

beforeEach(async () => {
  vi.clearAllMocks()
  await clearFiles()
  resetWorkbookSession()
  state.view = 'empty'
  state.importPhase = 'idle'
  state.importError = null
  state.restored = false
})

describe('启动恢复（直达最近导入文件）', () => {
  it('有文件 → 直接进入最近导入文件的工作簿页', async () => {
    await seedFile('订单旧.xlsx', 1000)
    await seedFile('订单新.xlsx', 2000)
    await restoreLibrary()
    expect(state.view).toBe('workbook')
    expect(workbookState.workbook?.fileName).toBe('订单新.xlsx')
    expect(workbookState.activeSheetName).toBe('沿河店') // 无记忆选第一个门店
    expect(state.restored).toBe(true)
  })

  it('重导旧文件后重启 → 仍直达该文件（按 importedAt 最近导入判定）', async () => {
    const idOld = await seedFile('订单A.xlsx', 1000)
    await seedFile('订单B.xlsx', 2000)
    // 模拟覆盖重导 A：firstImportedAt 保留、importedAt 更新为最新
    const record = (await getFile(idOld))!
    record.importedAt = 3000
    await putFile(record)
    await restoreLibrary()
    expect(workbookState.workbook?.fileName).toBe('订单A.xlsx')
  })

  it('无文件 → 落在导入引导空态', async () => {
    await restoreLibrary()
    expect(state.view).toBe('empty')
    expect(state.restored).toBe(true)
  })

  it('恢复最近文件的上次门店记忆', async () => {
    await seedFile('订单.xlsx', 1000, '江店1')
    await restoreLibrary()
    expect(workbookState.activeSheetName).toBe('江店1')
  })

  it('直达会话内切门店 → 持久化记忆（onSheetChange 回调链路）', async () => {
    const id = await seedFile('订单.xlsx', 1000)
    await restoreLibrary()
    switchSheet('江店1')
    // 回调异步写库，等待微任务队列清空
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect((await getFile(id))?.lastSheetName).toBe('江店1')
  })
})

describe('startImport（统一导入入口）', () => {
  it('取消选取 → 无状态变化', async () => {
    vi.mocked(pickExcelFile).mockResolvedValue(null)
    await startImport()
    expect(state.importPhase).toBe('idle')
    expect(state.view).toBe('empty')
    expect(showToast).not.toHaveBeenCalled()
  })

  it('解析期间防重复触发（不重复唤起选择器）', async () => {
    state.importPhase = 'parsing' // 等价 Worker 解析中（node 无法走真实 Worker）
    await startImport()
    expect(pickExcelFile).not.toHaveBeenCalled()
    expect(state.importPhase).toBe('parsing')
  })

  it('选取异常 → toast 错误且导入状态复位', async () => {
    vi.mocked(pickExcelFile).mockRejectedValue(new Error('所选文件不是 Excel 文件（仅支持 .xlsx / .xls）'))
    await startImport()
    expect(showToast).toHaveBeenCalledWith('所选文件不是 Excel 文件（仅支持 .xlsx / .xls）')
    expect(state.importPhase).toBe('idle')
  })
})
