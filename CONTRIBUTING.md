# Contributing to Sectioned Sidebar

[English](#english) | [简体中文](#简体中文)

## English

Thank you for helping improve Sectioned Sidebar. Bug reports, feature suggestions, documentation fixes, translations, and focused code contributions are welcome.

### Before you start

- Search the existing [issues](https://github.com/blank247d/sectioned-sidebar/issues) before opening a new one.
- Keep each issue or pull request focused on one problem.
- Remove personal vault names, note content, account details, and other private information from screenshots, recordings, logs, and sample data.
- Use a small demo vault when reproducing a problem whenever possible.

### Report a bug

Include:

- Obsidian version and operating system.
- Sectioned Sidebar version.
- Steps that consistently reproduce the problem.
- Expected and actual behavior.
- A sanitized screenshot, recording, or error message when it helps explain the issue.

### Suggest a feature

Describe the workflow you want to improve, the result you expect, and why the change belongs in Sectioned Sidebar. Mention any effect on navigation data, real vault paths, mobile support, localization, or compatibility with Obsidian's native file explorer.

### Develop locally

The plugin is distributed as plain JavaScript and CSS and does not require a build step.

1. Fork and clone the repository.
2. Place or link the checkout at `.obsidian/plugins/sectioned-sidebar/` inside a demo vault.
3. Enable **Sectioned Sidebar** under **Settings → Community plugins**.
4. Reload Obsidian after changing `main.js`, `styles.css`, or `manifest.json`.
5. Run the syntax check:

```bash
node --check main.js
```

### Test changes

For behavior or interface changes, verify that:

- Existing virtual sections and pinned paths still load.
- Creating, renaming, reordering, collapsing, and removing sections changes only plugin configuration.
- Pinning or removing a navigation item does not move or delete its real file.
- Notes open correctly and ordinary folders expand and collapse in place.
- File and folder context menus still expose Obsidian's familiar actions.
- Simplified Chinese, English, and **Follow Obsidian** language modes work.
- The native file explorer remains available in the same sidebar tab group.

### Pull requests

- Explain the problem and the chosen solution.
- Include sanitized screenshots or recordings for visible interface changes.
- Update documentation when behavior, installation, or supported workflows change.
- Do not commit vault data, plugin `data.json`, workspace state, credentials, or personal content.
- Do not change release versions or tags unless a maintainer requests it.
- Confirm that `node --check main.js` passes before submitting.

## 简体中文

感谢你帮助改进 Sectioned Sidebar。欢迎提交错误报告、功能建议、文档修正、翻译和范围明确的代码贡献。

### 开始之前

- 创建新 Issue 前，请先搜索已有的 [Issues](https://github.com/blank247d/sectioned-sidebar/issues)。
- 每个 Issue 或 Pull Request 只处理一个明确的问题。
- 从截图、录屏、日志和示例数据中移除个人仓库名、笔记内容、账户信息及其他隐私数据。
- 如条件允许，请使用小型演示仓库复现问题。

### 报告错误

请提供：

- Obsidian 版本与操作系统。
- Sectioned Sidebar 版本。
- 可以稳定复现问题的操作步骤。
- 预期行为与实际行为。
- 有助于说明问题且已经脱敏的截图、录屏或错误信息。

### 建议功能

请描述你希望改善的工作流程、期望结果，以及为什么该功能适合加入 Sectioned Sidebar。请说明它是否会影响导航配置、真实仓库路径、移动端支持、本地化，或与 Obsidian 原生文件管理器的兼容性。

### 本地开发

插件直接以 JavaScript 和 CSS 分发，不需要构建步骤。

1. Fork 并克隆本仓库。
2. 将仓库放置或链接到演示仓库中的 `.obsidian/plugins/sectioned-sidebar/`。
3. 在 **设置 → 第三方插件** 中启用 **Sectioned Sidebar**。
4. 修改 `main.js`、`styles.css` 或 `manifest.json` 后重新加载 Obsidian。
5. 运行语法检查：

```bash
node --check main.js
```

### 测试修改

如果修改涉及行为或界面，请确认：

- 已有虚拟分区和固定路径仍能正常加载。
- 创建、重命名、排序、折叠和移除分区时，只修改插件配置。
- 固定或移除导航项目时，不移动或删除对应的真实文件。
- 笔记可以正常打开，普通文件夹可以原位展开和折叠。
- 文件和文件夹右键菜单仍包含 Obsidian 熟悉的操作。
- 简体中文、英文和 **跟随 Obsidian** 三种语言模式均能正常工作。
- 原生文件管理器仍保留在同一个侧边栏标签组中。

### Pull Request

- 说明问题和采用的解决方案。
- 界面可见变化需要附上已经脱敏的截图或录屏。
- 行为、安装方式或支持的工作流程发生变化时，同步更新文档。
- 不要提交仓库数据、插件 `data.json`、工作区状态、凭据或个人内容。
- 除非维护者要求，否则不要修改发布版本或标签。
- 提交前确认 `node --check main.js` 已通过。
