# Enhanced ELM 测试者快速指南

适用于 Chrome 及基于 Chromium 的浏览器。Enhanced ELM 仅作用于 ELM 的 **New look** 页面。

## 1. 获取并解压测试包

下载 `Enhanced-ELM-0.1.1.zip`，将其解压到一个不会被移动或删除的文件夹。

解压后的文件夹内应能直接看到 `manifest.json`、`src` 和 `assets`。加载扩展时请选择这个文件夹，不要选择 ZIP 文件本身。

## 2. 在 Chrome 中加载

1. 在地址栏打开 `chrome://extensions`。
2. 打开右上角的 **Developer mode / 开发者模式**。
3. 点击 **Load unpacked / 加载已解压的扩展程序**。
4. 选择上一节中包含 `manifest.json` 的解压文件夹。
5. 如有需要，点击扩展卡片上的图钉，将 **Enhanced ELM** 固定到工具栏。

Chrome 应显示 Enhanced ELM `0.1.1`，且没有红色错误提示。

## 3. 打开 ELM

1. 登录 [ELM New look](https://elm.edina.ac.uk/elm-new)。
2. 确认页面顶栏的 **Try our new look!** 已开启。
3. 刷新页面一次。

扩展默认启用。可点击工具栏中的 Enhanced ELM 图标，按需开关 Math Repair、Markdown tools 等选项。

> ELM 的旧界面不在本扩展支持范围内。请始终使用 `/elm-new` 和 New look。

## 4. 建议测试项目

- 输入多段长文本，确认文本框内部可滚动，模型和发送按钮不会被遮挡。
- 切换 Model family，确认模型会变为该家族的第一个可用模型。
- 让 ELM 输出 Markdown、代码块和 LaTeX，检查代码复制、Markdown 复制及公式渲染。
- 添加附件，确认右下角纸夹显示数量；悬停或点击后可查看附件，且输入框下方没有大块附件栏。
- 展开侧栏，测试时间线跳转、关键消息书签和本地 Markdown 下载。
- 在明亮与深色主题下查看代码块和正文是否清晰可读。

## 5. 更新或排错

代码或测试包更新后：

1. 回到 `chrome://extensions`。
2. 在 Enhanced ELM 卡片点击 **Reload / 重新加载**。
3. 回到 ELM 并刷新页面。

若页面没有变化，请依次确认：已使用 New look、已刷新页面、扩展处于启用状态，且没有同时启用其他会修改 ELM 数学渲染或页面样式的扩展。

反馈问题时，请附上浏览器版本、屏幕截图、使用的模型，以及可复现问题的最短操作步骤。请勿在截图中包含敏感对话内容。
