# App Packaging Specification

## Purpose

定义应用的安卓打包与运行时适配能力：Capacitor 壳工程、WebView 文件选择、安全区与返回键行为、签名 APK 交付要求。

## Requirements

### Requirement: Capacitor 安卓壳工程
应用 SHALL 基于 Capacitor 生成安卓壳工程并以 WebView 加载前端构建产物，交付可安装的签名 APK。

#### Scenario: APK 安装启动
- **WHEN** 用户在安卓手机上安装交付的 APK 并启动
- **THEN** 应用全屏打开主界面（单页应用，无浏览器地址栏），首次启动进入未导入初始状态

### Requirement: WebView 文件选择
应用内点击「Excel 导入」唤起的文件选择 SHALL 在安卓系统文件选择器（含微信/QQ 下载目录场景）中正常工作，可选文件类型限定为 Excel 相关类型。

#### Scenario: 从下载目录选取
- **WHEN** 用户在安卓文件选择器中浏览 Download 目录并选取 .xlsx 文件
- **THEN** 文件成功传入应用并完成导入流程

#### Scenario: 文件类型过滤
- **WHEN** 系统文件选择器打开时
- **THEN** 默认按电子表格类型过滤展示（不阻止用户切换「所有文件」选择 .xls）

### Requirement: 竖屏单页与安全区适配
应用 SHALL 以竖屏手机布局运行，内容 MUST 适配状态栏与导航栏安全区，MUST NOT 出现内容被系统栏遮挡或双滚动条。

#### Scenario: 异形屏适配
- **WHEN** 应用在带刘海/挖孔屏的安卓手机上运行
- **THEN** 顶栏不被状态栏遮挡，底部内容不被手势导航条遮挡

### Requirement: 返回键行为
安卓系统返回键 SHALL 在应用内表现为可控行为：搜索框聚焦时先收起键盘，其余情况退出应用；MUST NOT 触发页面导航历史错乱。

#### Scenario: 收起键盘
- **WHEN** 搜索框聚焦、键盘弹出时用户按返回键
- **THEN** 键盘收起且焦点离开搜索框，应用不退出

#### Scenario: 退出应用
- **WHEN** 键盘未弹出时用户按返回键
- **THEN** 应用正常退到后台/退出，无异常
