package com.hariku.excelordersearch;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/**
 * 原生 Excel 文件选择（design.md D2）：
 * ACTION_OPEN_DOCUMENT + EXTRA_MIME_TYPES 锁死 Excel 类型——
 * 比 WebView input[type=file] 的 accept 属性约束力强（国产 ROM 不无视）。
 * 选取后经 ContentResolver 读流 → base64 回传 JS。
 */
@CapacitorPlugin(name = "ExcelPicker")
public class ExcelPickerPlugin extends Plugin {

    private static final int MAX_FILE_BYTES = 64 * 1024 * 1024; // 64MB 防御上限

    @PluginMethod
    public void pick(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        // 显式 MIME 列表：xlsx(OOXML) + xls(OLE2)
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel"
        });

        startActivityForResult(call, intent, "onPicked");
    }

    @ActivityCallback
    private void onPicked(PluginCall call, androidx.activity.result.ActivityResult result) {
        if (call == null) {
            return;
        }
        if (result.getResultCode() != Activity.RESULT_OK) {
            // 用户取消：正常路径，resolve 而非 reject
            call.resolve(new JSObject());
            return;
        }
        Uri uri = result.getData() != null ? result.getData().getData() : null;
        if (uri == null) {
            call.reject("未获取到文件");
            return;
        }

        try {
            String fileName = queryFileName(uri);
            byte[] bytes = readAllBytes(uri);
            if (bytes.length > MAX_FILE_BYTES) {
                call.reject("文件过大（超过 64MB），请检查是否选错文件");
                return;
            }

            JSObject ret = new JSObject();
            ret.put("fileName", fileName);
            ret.put("base64", Base64.encodeToString(bytes, Base64.NO_WRAP));
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("读取文件失败：" + e.getMessage());
        }
    }

    /** 从 SAF 元数据取显示文件名，取不到退化为 uri 最后一段 */
    private String queryFileName(Uri uri) {
        try (android.database.Cursor cursor = getContext()
                .getContentResolver()
                .query(uri, null, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int idx = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME);
                if (idx >= 0 && cursor.getString(idx) != null) {
                    return cursor.getString(idx);
                }
            }
        } catch (Exception ignored) {
        }
        String path = uri.getLastPathSegment();
        return path == null ? "未知文件" : path.substring(path.lastIndexOf('/') + 1);
    }

    private byte[] readAllBytes(Uri uri) throws Exception {
        try (InputStream in = getContext().getContentResolver().openInputStream(uri)) {
            if (in == null) {
                throw new IllegalStateException("无法打开文件流");
            }
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] chunk = new byte[64 * 1024];
            int read;
            while ((read = in.read(chunk)) > 0) {
                buffer.write(chunk, 0, read);
            }
            return buffer.toByteArray();
        }
    }
}
