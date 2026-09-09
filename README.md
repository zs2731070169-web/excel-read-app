# Excel 订单搜索（安卓 App）

门店商品/订单查询工具：导入 Excel 工作簿（.xlsx / .xls，每家门店一个工作表），按**商品名称或货架号**搜索当前门店的记录（商品名称、条形码、货架号、价格），支持长按自由选择复制与整行一键复制。

技术栈：Vue 3 + Vite + TypeScript + SheetJS + Vant 4 + Capacitor → 签名 APK。

## 功能对照

| 能力 | 说明 |
|---|---|
| Excel 导入 | 文件选择器选 .xlsx/.xls，后台解析；改了文档需重新导入；数据本地持久化（重启免重导）；支持一键清空（确认弹窗） |
| 文档页切换 | 顶栏下拉列出全部工作表（门店），未导入时禁用 |
| 搜索 | 匹配商品名称/货架号，不区分大小写包含匹配，仅当前选中工作表；显式「搜索」按钮/键盘搜索键触发，改词/切页后结果清空 |
| 复制 | 长按结果文字自由选择复制；每行「复制」按钮整行复制（TAB 分隔，粘贴到 Excel 自动分列） |
| 格式要求 | 首行表头需含：商品名称、条形码（识别 UPC码/条码/UPC 等别名）、货架号、价格；列顺序不限；条形码按文本读取（保留前导零、不落科学计数法） |

规格与设计：`openspec/changes/excel-order-search-app/`（proposal / specs / design / tasks）。

## 开发

```bash
pnpm install
pnpm dev        # 浏览器开发（http://localhost:5173）
pnpm test       # Vitest（30 个用例）
pnpm build      # vue-tsc 类型检查 + 产物构建 → dist/
```

## 构建 APK

前置：JDK 17+（本机 JDK 24 验证通过）、Android SDK（platform-tools / platforms;android-36 / build-tools;36.0.0）。

首次需配置：
1. `android/local.properties`：`sdk.dir=<你的 Android SDK 路径>`
2. `android/keystore.properties`（不入库）：
   ```properties
   storeFile=../excel-search-release.keystore
   storePassword=<密码>
   keyAlias=excel-search
   keyPassword=<密码>
   ```

构建：
```bash
pnpm build                  # 1. 前端产物
npx cap sync android        # 2. 拷入壳工程
cd android
./gradlew assembleRelease   # 3. 出签名 APK
# 产物: android/app/build/outputs/apk/release/app-release.apk
```

调试版：`./gradlew assembleDebug`。

## 网络注意事项（本机）

GitHub / Google 下载需走本地代理：命令前加 `https_proxy=http://127.0.0.1:7892 http_proxy=http://127.0.0.1:7892`（Gradle 首次下载依赖时同样适用）。

## 签名密钥保管（交付必读）

- `excel-search-release.keystore`（仓库根，**已 gitignore 不入库**）+ `keystore.properties` + 密码，三者一起移交客户
- 密钥有效期 25 年（至 2051 年）
- **丢失 keystore = 无法再对同一应用发升级版**，务必离线备份（客户 U 盘/密码管理器）
- 证书指纹（SHA-256）：`dc8cd0a6689dbcb7622e245ffd3e87cad5e21fea8d1656bfb66d7d827f8d809d`

## 真机验收清单（交付前）

- [ ] 文件选择器唤起，从下载目录选 .xlsx / .xls 导入成功
- [ ] 多门店 Sheet 下拉切换；未导入时下拉禁用
- [ ] 搜索：按钮触发、键盘搜索键触发；改词/切页后旧结果清空
- [ ] 长按结果文字可自由选择复制；整行复制粘贴到 Excel 分列正确
- [ ] 条形码完整显示（无科学计数法、前导零保留）
- [ ] 重启 App 数据恢复；清空功能（确认弹窗）后回到初始态
- [ ] 刘海屏顶栏/底部无遮挡；键盘弹出时返回键先收键盘
