package com.hariku.excelordersearch;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 注册原生 Excel 选择插件（必须在 super.onCreate 之前）
        registerPlugin(ExcelPickerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
