# Excel 订单搜索（安卓 App）

门店商品/订单查询工具：导入的 Excel 工作簿（.xlsx / .xls，每家门店一个工作表）保存在 App 文件库里，点开即浏览全部记录，也可按**商品名称或货架号**搜索，支持长按自由选择复制与整行一键复制。

技术栈：Vue 3 + Vite + TypeScript + SheetJS + Vant 4 + Capacitor → 签名 APK。

## 功能对照

| 能力 | 说明 |
|---|---|
| 文件库首页 | App 启动即见已导入文件列表（图标/文件名/日期，最新在上）；空库引导导入 |
| Excel 导入 | 原生系统选择器**只显示 Excel 文件**（MIME 过滤+魔数校验双保险）；同名重导自动覆盖（位置保留、日期更新）；旧版单文件数据自动迁移 |
| 逐文件删除 | 文件卡**左滑**展开红色删除按钮（右滑收回，同时仅一项展开），确认后仅移出 App，**不影响手机原文件**；无全局清空入口 |
| 浏览模式 | 进入工作簿直接展示当前门店全部记录（按 Excel 行序），切门店联动刷新 |
| 搜索 | 匹配商品名称/货架号，不区分大小写包含匹配，仅当前门店；显式「搜索」按钮/键盘搜索键触发；改词/切页回浏览模式 |
| 门店记忆 | 每个文件独立记住上次选的门店，再次打开自动恢复 |
| 复制 | 长按结果文字自由选择复制；每行「复制」按钮整行复制（TAB 分隔，粘到 Excel 自动分列） |
| 格式要求 | 首行表头需含：商品名称、条形码（识别 UPC码/条码/UPC 等别名）、货架号、价格；列顺序不限；条形码按文本读取（保留前导零、不落科学计数法） |
| 返回键 | 工作簿页返回 → 回文件库；文件库页返回 → 退出 App |

规格与设计：`openspec/changes/multi-file-library/`（进行中）与 `openspec/changes/archive/`（已交付迭代）。

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

- [x] 文件选择器仅显示 Excel 文件；从微信下载目录选取 .xlsx 成功（真机验证）
- [x] 启动落文件库页；导入自动进工作簿；浏览模式直接显示记录（真机验证）
- [x] 顶栏状态栏适配（Android 15 edge-to-edge 修复，真机验证）
- [ ] 左滑删除交互流畅性（跟手/顺滑/唯一展开）走查
- [ ] 搜索全场景：按钮/键盘触发、过期清空、门店记忆恢复
- [ ] 长按自由选择复制；整行复制粘贴到 Excel 分列正确
- [ ] 重启 App 文件库完整恢复；返回键两层行为
- [ ] 旧版数据自动迁移（在装有旧版数据的手机上覆盖安装验证）

## 注意事项

- **勿混装旧版本**：v2 数据库结构与旧版不兼容，降级安装旧版会看不到已导入文件（升级无影响，自动迁移）
- 同名同大小的两个文件视为同一文件（覆盖语义）；文件内容变化必然改变大小，不受影响
