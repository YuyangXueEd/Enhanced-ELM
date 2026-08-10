# Enhanced ELM

> 面向 [ELM](https://elm.edina.ac.uk/elm-new) 的本地优先效率增强扩展。

[English](README.md) · [测试者快速指南](docs/TESTER-GUIDE.md) · [架构说明](docs/architecture.md) · [隐私政策](docs/PRIVACY.md) · [参与贡献](CONTRIBUTING.md)

Enhanced ELM 仅在 ELM 的 **New look** 中提供更紧凑、更易读的工作区，不替换 ELM 的对话和模型逻辑。所有功能均在浏览器本地运行；不包含服务器、分析、远程配置或云同步。

> Enhanced ELM 是独立项目，与爱丁堡大学、EDINA 或 ELM 没有隶属、背书或运营关系。

## 本地字体

Enhanced ELM 保留 ELM 原生的界面与正文阅读字体；仅为代码块和其他明确的等宽内容本地提供 CaskaydiaCove Nerd Font。不会向 Google Fonts 或其他第三方字体服务发送请求；数学公式和 Material 图标保留各自专用字体。

## 功能

| 模块 | 能力 |
| --- | --- |
| 洁净工作区 | 紧凑的明暗配色、仅显示标题的历史列表、收起侧栏后的宽屏阅读区，以及固定在底部的新对话输入框。 |
| 模型工作流 | 使用 **模型家族 → ELM 原生模型**。切换家族会选择该家族的第一个原生模型；实际模型菜单和 reasoning effort 仍完全由 ELM 管理。可将当前模型设为本地默认值。 |
| 数学修复 | 保守地使用 KaTeX 渲染可验证的完整 LaTeX、代码包裹公式、双反斜杠命令，以及已发现的摄氏温度范围拆分问题；支持复制 LaTeX。 |
| 本地快照库 | 手动保存 Markdown 快照，支持文件夹、标签、搜索和下载；不会在后台自动备份你的对话。 |
| 附件 | 右下角带数量提示的回形针悬浮按钮；悬停、聚焦或点击后打开 ELM 原生附件摘要，不再在输入框下方预留整行空间。 |
| 关键消息 | 给消息添加书签与本地笔记，并从侧栏快速回跳。 |
| Markdown 增强 | 单条消息复制为 Markdown、代码块复制、当前可见对话下载为 Markdown。 |
| 时间线 | 桌面端紧凑时间线，快速跳转到当前对话中的消息。 |

## 安装

### Chrome / Edge 本地加载

1. 下载或克隆本仓库。
2. 打开 `chrome://extensions` 或 `edge://extensions`，开启**开发者模式**。
3. 点击 **Load unpacked / 加载已解压的扩展程序**，选择本仓库目录。
4. 先在 ELM 中切换到 **New look**，再打开或刷新 `https://elm.edina.ac.uk/elm-new`。
5. 从浏览器工具栏的扩展弹窗启用界面、数学修复或 Markdown 工具。

代码改动后，请在扩展卡片点击 **Reload / 重新加载**，再刷新 ELM。该扩展有意不在 ELM 旧版界面运行。当前版本无需构建，仓库目录可直接加载。

## 本地数据与隐私

- 设置、已保存的快照、默认模型偏好、书签和笔记都保存在当前浏览器配置文件的 `chrome.storage.local` 中。
- 仅当你主动保存快照或为消息创建书签时，扩展才会持久化对话文字；导出和复制均在本地浏览器内完成。
- Enhanced ELM 不会将页面内容、保存的数据或标识发送给开发者或第三方。
- 移除扩展或清除其扩展数据会删除这些本地数据。

上架前请阅读并部署完整的[隐私政策](docs/PRIVACY.md)。

## 数学修复边界

数学修复只处理 KaTeX 能够验证的完整公式，不会穿过普通文本猜测公式、执行远程代码或替换任意页面内容。不能安全解析时，原文会保留。KaTeX 0.17.0 已随扩展打包，许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

如果同时安装了 [ELM Math Fixer](https://github.com/lambdacdm/ELM-Math-Fixer)，比较修复效果时请一次只启用一个数学修复扩展，避免二者同时处理同一段内容。

## 开发与贡献

项目结构、数据边界与手动回归测试见：

- [架构说明](docs/architecture.md)
- [测试清单](docs/TESTING.md)
- [贡献指南](CONTRIBUTING.md)

欢迎提交 Issue 和 Pull Request。请保持功能只服务 ELM、避免远程可执行代码、坚持本地优先，并为新增选择器或 DOM 改动补充验证步骤。

## 许可证

Enhanced ELM 使用 [MIT License](LICENSE) 发布。KaTeX 保留其 MIT 许可证，字体保留各自的 SIL Open Font License 1.1；见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
