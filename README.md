<div align="center">

<img src="assets/icon/excel-tool-icon.png" width="128" alt="Excel订单搜索" />

# 📊 Excel 订单搜索

**门店商品/订单查询安卓工具**

<img src="assets/badges/platform-android.svg" alt="Platform: Android" />
<a href="https://vuejs.org/"><img src="assets/badges/vue.svg" alt="Vue: 3.5" /></a>
<a href="https://capacitorjs.com/"><img src="assets/badges/capacitor.svg" alt="Capacitor: 8.5" /></a>
<img src="assets/badges/license-mit.svg" alt="License: MIT" />

</div>

> 本项目采用 OpenSpec（SDD 规格层）+ Claude Code（工程纪律层）双层工作流开发，需求规格与设计产物见 `openspec/`。

> 主链路为「导入 Excel → 按门店浏览 / 搜索 → 勾选 → TAB 分隔复制到剪贴板」。数据全部存储于手机本地（IndexedDB），不上传任何服务器。

---

## ✨ 功能特性

### 📥 Excel 导入
- **系统选择器直选**：唤起安卓系统文件选择器，默认仅列出 Excel 文件，微信/QQ 下载目录可直接选取
- **双格式支持**：.xlsx 与 .xls（Excel 97-2004 二进制）同等解析
- **按表头文字识别列**：四个必需列「商品名称 / 条形码 / 货架号 / 价格」按首行表头映射，各列支持中文别名（如条形码列兼容「UPC码 / 条码 / UPC」），任意列序均可
- **条形码按文本读取**：13 位以上长码不落科学计数法（6953123500761 ✓）、前导零保留（0069012345678 ✓）、价格不加货币符号
- **后台异步解析**：Web Worker 中解析大工作簿，界面不冻结，解析期间导入按钮防重复触发
- **坏文件拦截**：改名的文本文件 / 损坏文件在解析前按魔数校验拒绝并提示，不影响库内已有文件
- **导入成功停留文件库**：新文件置顶列表，点击文件卡片进入工作簿页

### 📚 文件库管理
- **多文件库**：列表按导入时间倒序，每项含 Excel 图标、文件名、导入日期
- **左滑删除**：删除仅移除库内解析数据，手机上的原文件不受影响；删除前需确认
- **同名重导覆盖**：在 Excel 改完数据重新导入同名文件，旧记录被新内容完全覆盖，列表位置不变、导入日期更新
- **本地持久化**：IndexedDB 存储，重启 App 自动恢复；从旧版单工作簿模型升级自动迁移，无需重新导入

### 🗂 门店浏览与搜索
- **门店下拉切换**：工作表即门店，下拉切换；每个文件独立记忆上次使用的门店
- **浏览模式**：未搜索时按 Excel 行序展示当前门店全部记录
- **显式搜索**：点「搜索」按钮或键盘搜索键才触发（输入过程不实时过滤）；对商品名称 / 货架号做不区分大小写的包含匹配，仅限当前门店范围
- **结果不过期展示**：关键词变更或切换门店后旧结果自动清空，回到待搜索状态

### 📋 勾选复制
- **先勾选后复制**：未勾选任何行时复制按钮禁用，杜绝误复制整表；复制全部 = 全选 →「复制选中（N）」
- **TAB 分隔定稿**：每行「名称 ⇥ 条形码 ⇥ 货架号 ⇥ 价格」，行间换行；粘贴进 Excel / WPS 自动分列，也可直接粘进微信
- **长按自由复制**：结果文本支持长按唤起系统选择菜单自由选取（行内格式尽力而为，精确格式请走勾选复制）

### 📱 安卓适配
- 竖屏全屏单页应用，适配状态栏 / 导航栏安全区，刘海/挖孔屏不被遮挡
- 系统返回键两层导航：键盘弹出先收键盘 → 工作簿页返回文件库 → 文件库页正常退出

---

## 📦 安装与运行

### 方式一：直接安装 APK（推荐）

将 release 构建产物 `excel读取.apk` 传到安卓手机，开启**允许安装未知来源应用**后安装即可。

> 首次启动进入空文件库，点右上角「Excel 导入」开始使用。卸载 App 即清空全部导入数据（IndexedDB 随应用删除），手机原 Excel 文件不受影响。

### 方式二：从源码构建

环境前置：

| 依赖 | 要求 |
|------|------|
| Node.js + pnpm | 仓库含 `pnpm-lock.yaml`，请使用 pnpm 而非 npm/yarn |
| JDK | 实测 Amazon Corretto OpenJDK 24 可用 |
| Android SDK | compileSdk 36 / targetSdk 36 / minSdk 24 |
| `android/local.properties` | `sdk.dir=<你的 Android SDK 路径>`（不入库，Android Studio 打开工程自动生成） |

```bash
# 1. 克隆项目
git clone <repo-url>
cd excel-read-app

# 2. 安装依赖
pnpm install

# 3. 构建前端产物（vue-tsc 类型检查 + vite build → dist/）
pnpm build

# 4. 同步 Web 资源到安卓壳工程
npx cap sync android

# 5. 构建签名 APK（Gradle wrapper 8.14.3，无需预装 Gradle）
cd android && ./gradlew assembleRelease
# 产物: android/app/build/outputs/apk/release/excel读取.apk
```

> 调试版：`./gradlew assembleDebug` → `android/app/build/outputs/apk/debug/excel读取-debug.apk`；安装到已连接设备：`./gradlew installDebug`。

---

## 🔑 签名配置

release 签名由 `android/app/build.gradle` 读取 `android/keystore.properties`（不入库）：

```properties
storeFile=../excel-search-release.keystore   # 相对 android/ 目录，指向仓库根的 keystore 文件
storePassword=<密码>
keyAlias=excel-search
keyPassword=<密码>
```

- `keystore.properties` 缺失时 `assembleRelease` 仍能构建，但产出**未签名 APK**（无法直接安装）
- `*.keystore` 与 `keystore.properties` 均被 .gitignore 排除，需单独获取与保管

> ⚠️ **丢失 keystore = 无法再对同一应用发升级版**，务必离线备份。

---

## 🧪 测试

```bash
pnpm test   # vitest run：8 个测试文件 / 53 个用例全绿
```

| 测试文件 | 覆盖 |
|---|---|
| `excelParser.test.ts` | 双格式解析、表头别名/乱序/缺列、长条形码不落科学计数法、损坏文件抛错 |
| `realFile.regression.test.ts` | 真实订单文件回归：防丢尾行、防表头识别退化 |
| `persistence.test.ts` | 文件 id 规则（同名同大小=覆盖）、CRUD、倒序、v1→v2 迁移 |
| `excelPicker.test.ts` | 原生路径魔数预校验拒绝非 Excel 文件 |
| `clipboard.test.ts` | 行文本 TAB 拼接、空字段占位防串列 |
| `useLibrary.test.ts` | 文件库状态流转：启动恢复、门店记忆、删除回退、导入后停留文件库 |
| `useWorkbook.test.ts` | 搜索状态机：匹配规则、结果过期清空、会话注入与门店恢复 |
| `ResultRow.test.ts` | DOM 渲染断言：文本真实含 3 个 TAB、勾选框存在 |

---

## 🏗️ 技术架构

```
excel-read-app/
├── src/
│   ├── components/           # Vue 组件
│   │   ├── FileLibrary.vue   # 文件库首页（导入入口、删除确认）
│   │   ├── FileCard.vue      # 文件卡（原生 touch 左滑删除）
│   │   ├── TopBar.vue        # 工作簿顶栏（返回/文件名/门店下拉）
│   │   ├── SearchBar.vue     # 搜索栏（按钮/IME 显式触发）
│   │   ├── ResultList.vue    # 结果区 + 底部勾选复制操作栏
│   │   └── ResultRow.vue     # 单行记录（TAB 注入 + user-select 覆盖）
│   ├── composables/          # 组合式函数（双层状态架构）
│   │   ├── useLibrary.ts     # 全局层：视图切换/导入状态机/Worker 生命周期
│   │   └── useWorkbook.ts    # 会话层：门店切换/搜索状态机（数据由注入获得）
│   ├── services/             # 业务逻辑
│   │   ├── excelParser.ts    # SheetJS 解析（魔数校验 + raw:true）
│   │   ├── excelPicker.ts    # 原生文件选择桥（Capacitor 插件）
│   │   ├── excelWorker.ts    # Web Worker 异步解析
│   │   ├── clipboard.ts      # 剪贴板写入（双路径降级）
│   │   ├── persistence.ts    # IndexedDB 持久化 + 旧库迁移
│   │   └── types.ts          # 数据模型 + 表头别名表
│   ├── styles/base.css       # 全局样式 + 安全区变量
│   └── main.ts               # 入口（启动恢复 + 返回键分派）
├── android/                  # Capacitor 安卓壳工程（签名打包）
├── assets/                   # 应用图标与 README 徽章
├── openspec/                 # SDD 规格产物（需求唯一事实源）
└── dist/                     # 前端构建产物（Capacitor webDir）
```

**主链路数据流**（导入 → 复制）：

```
文件库「Excel导入」
  → excelPicker：原生选择器 → base64 → 魔数预校验(PK/OLE2) → ArrayBuffer
  → useLibrary.importFile：parsing 态 + 请求代际号，postMessage transfer 零拷贝
  → excelWorker(Web Worker) → excelParser：魔数二次校验 → XLSX.read(raw:true) → 表头别名映射
  → persistence(IndexedDB)：fileIdentity(文件名+字节数) 同名覆盖 → 刷新列表、停留文件库
  → FileCard 点击 openFile：恢复上次门店 → 进入工作簿页
  → useWorkbook.search：当前 Sheet 名称/货架号包含匹配（大小写不敏感）
  → 勾选 → clipboard：每行「名称\t条形码\t货架\t价格」多行拼接 → toast「已复制 N 条」
```

**关键技术约束**（跨文件才能看清，改动的回归重点）：

- **解析必须在 Web Worker**：大文件同步解析会卡死主线程触发 ANR；`postMessage` 以 transfer list 零拷贝转移；请求代际号机制丢弃过期响应（重复导入时旧结果不得入库）；文件字节数须在 transfer 前于主线程记录
- **`raw:true` 读取单元格**：SheetJS 默认 General 渲染在源头就把 13 位条形码截断为科学计数法；raw 模式读原始 double 由 `String()` 完整十进制化，文本单元格（前导零）天然保留
- **魔数校验做两层**（选文件时 + 解析前）：SheetJS 会把任意文本嗅探为 CSV「解析成功」，且部分 ROM 选择器无视 MIME 过滤，必须在 `XLSX.read` 之前拦下
- **`androidScheme: 'https'`**：Capacitor WebView 默认 localhost 非安全上下文，`navigator.clipboard` 不可用；剪贴板策略为 navigator.clipboard 优先、隐藏 textarea + `execCommand` 降级、失败抛错引导长按复制
- **同名覆盖语义**：文件 id =（文件名 + 字节数）的 FNV-1a 哈希——同名同大小视为同一文件覆盖；覆盖时保留 `firstImportedAt`（排序键）与 `lastSheetName`（门店记忆），仅更新 `importedAt`
- **TAB 真实注入 DOM**：长按自由复制依赖 DOM 中存在字面 TAB——以字符串表达式 `{{ '\t' }}` 注入 `.sep` span（绕过 Vue whitespace 压缩与 HTML 实体解析两个坑），`font-size: 0` 不占可见宽度
- **覆盖 Vant 的 `user-select: none`**：结果行不使用 Vant 文本组件，原生 span 显式 `user-select: text` + `-webkit-touch-callout: default`，否则长按选择被全局主题杀死
- **安全区三层保险**：Android 15+ 强制 edge-to-edge，`--safe-top` 取 max（Capacitor 原生注入值 > env() > 24px 固定下限）
- **返回键两层分派**：键盘弹出时由系统 IME 先消费返回事件；到达 JS 的工作簿页 → 回文件库，文件库页 → `exitApp()`

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| [Vue 3](https://vuejs.org/) | 响应式 UI 框架 |
| [Vite 8](https://vite.dev/) | 构建工具 |
| [TypeScript 5](https://www.typescriptlang.org/) | 类型安全 |
| [SheetJS (xlsx)](https://sheetjs.com/) | Excel 解析（.xlsx / .xls） |
| [Vant 4](https://vant-ui.github.io/vant/) | 移动端 UI 组件库 |
| [Capacitor 8](https://capacitorjs.com/) | WebView 壳 + 原生桥接 |
| Web Worker | 大文件后台解析 |
| IndexedDB | 本地持久化 |
| [Vitest 5](https://vitest.dev/) + happy-dom | 单元测试 |

---

## 📝 开发指南

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装依赖 |
| `pnpm dev` | 浏览器开发（http://localhost:5173，文件选择自动降级 `input[type=file]`） |
| `pnpm test` / `pnpm test:watch` | 单元测试（单次 / watch） |
| `pnpm build` | vue-tsc 类型检查 + 生产构建 |
| `npx cap sync android` | 前端产物同步进安卓工程（改完前端需重跑再打包） |

> 需求事实源在 `openspec/specs/`（OpenSpec SDD 工作流），实现遵循 TDD；安卓返回键逻辑在 Web 环境自动忽略，浏览器即可调试主链路。

---

## 📄 License

MIT

---

<div align="center">
  <sub>Made with ❤️ · Excel 订单搜索</sub>
</div>
