/// <reference lib="webworker" />
import { parseWorkbook } from './excelParser'
import type { WorkbookData } from './types'

/** 主线程 → Worker：待解析文件 */
export interface ParseRequest {
  id: number
  arrayBuffer: ArrayBuffer
  fileName: string
}

/** Worker → 主线程：解析完成 */
export interface DoneMessage {
  type: 'done'
  id: number
  data: WorkbookData
}

/** Worker → 主线程：解析失败 */
export interface ErrorMessage {
  type: 'error'
  id: number
  message: string
}

export type WorkerMessage = DoneMessage | ErrorMessage

const ctx = self as unknown as DedicatedWorkerGlobalScope

ctx.onmessage = (e: MessageEvent<ParseRequest>) => {
  const { id, arrayBuffer, fileName } = e.data
  try {
    // 解析在 Worker 线程同步执行（数万行 sheet_to_json 为毫秒级，无需分片/进度上报），
    // 完成后一次性返回整簿结果
    const data = parseWorkbook(arrayBuffer, fileName)
    ctx.postMessage({ type: 'done', id, data } satisfies DoneMessage)
  } catch (err) {
    ctx.postMessage({
      type: 'error',
      id,
      message: err instanceof Error ? err.message : '文件解析失败',
    } satisfies ErrorMessage)
  }
}
