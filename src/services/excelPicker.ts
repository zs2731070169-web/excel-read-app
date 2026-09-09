import { Capacitor, registerPlugin } from '@capacitor/core'

/**
 * 原生 Excel 文件选择桥（design.md D2）。
 * Web 预览环境降级为 input[type=file]（开发调试用）。
 */
interface ExcelPickerPlugin {
  /** 原生选文件；取消时返回空对象 */
  pick(): Promise<{ fileName?: string; base64?: string }>
}

const ExcelPicker = registerPlugin<ExcelPickerPlugin>('ExcelPicker')

export interface PickedFile {
  fileName: string
  arrayBuffer: ArrayBuffer
}

/** 魔数：xlsx=ZIP(PK..), xls=OLE2(D0 CF 11 E0)——解析前预校验，兜底 ROM 无视 MIME 过滤的场景 */
function looksLikeExcel(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b
  const isOle2 = bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0
  return isZip || isOle2
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * 唤起系统文件选择器（仅 Excel 类型）。
 * 返回 null = 用户取消；文件非 Excel 抛错（预校验，提示层捕获）。
 */
export async function pickExcelFile(): Promise<PickedFile | null> {
  if (Capacitor.isNativePlatform()) {
    const result = await ExcelPicker.pick()
    if (!result.fileName || !result.base64) return null // 取消
    const bytes = base64ToBytes(result.base64)
    if (!looksLikeExcel(bytes)) {
      throw new Error('所选文件不是 Excel 文件（仅支持 .xlsx / .xls）')
    }
    return { fileName: result.fileName, arrayBuffer: bytes.buffer }
  }

  // Web 预览降级：input[type=file]
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      const buf = await file.arrayBuffer()
      if (!looksLikeExcel(new Uint8Array(buf))) {
        reject(new Error('所选文件不是 Excel 文件（仅支持 .xlsx / .xls）'))
        return
      }
      resolve({ fileName: file.name, arrayBuffer: buf })
    }
    input.click()
  })
}
