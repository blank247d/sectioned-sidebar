# Sectioned Sidebar

[English](README.md) | [简体中文](README.zh-CN.md)

Sectioned Sidebar 是一款 Obsidian 社区插件，可将笔记和文件夹整理到可自定义的侧边栏分区中。它提供灵活、受 Notion 启发的导航体验，同时确保每个项目都对应仓库中的真实文件或文件夹。

[在 Obsidian 中安装](https://obsidian.md/plugins?id=sectioned-sidebar) · [插件市场页面](https://community.obsidian.md/plugins/sectioned-sidebar) · [最新版本](https://github.com/blank247d/sectioned-sidebar/releases/latest)

![Sectioned Sidebar 界面概览](assets/sectioned-sidebar-overview.png)

## 操作演示

![在 Sectioned Sidebar 中展开文件夹](assets/sectioned-sidebar-demo.gif)

截图和动图均来自真实的 Obsidian 界面，使用的独立演示仓库只包含虚构的分区、文件夹和笔记，不含任何个人仓库内容。

## 功能

- 创建、重命名、排序、折叠和移除虚拟侧边栏分区。
- 跟随 Obsidian 的界面语言，或手动切换简体中文和英文。
- 固定已有笔记和文件夹，而不改变它们在仓库中的真实路径。
- 直接展开普通文件夹并浏览其下级内容。
- 显示包含扩展名的完整文件名。
- 复用 Obsidian 的文件菜单扩展机制，提供熟悉的文件和文件夹操作。
- 将导航专属操作集中在独立的 **导航管理** 子菜单中。
- 跟随 Obsidian 的重命名事件更新固定路径，避免引用失效。
- 删除真实笔记或文件夹时，自动移除对应的导航引用。

## 使用场景

- 为收藏夹、项目、共享、私人或归档等区域建立 Obsidian 自定义侧边栏。
- 在不改变真实仓库路径的情况下，将常用笔记和文件夹集中到导航中。
- 保留 Obsidian 文件化数据模型，同时获得紧凑、受 Notion 启发的工作区导航。
- 直接在整理后的导航视图中浏览多层文件夹结构。
- 针对不同工作流程建立独立的导航分组，而不重复创建笔记。

## 安装

### 通过插件市场安装（推荐）

1. [在 Obsidian 中打开 Sectioned Sidebar](https://obsidian.md/plugins?id=sectioned-sidebar)，或进入 **设置 → 第三方插件 → 浏览** 并搜索 `Sectioned Sidebar`。
2. 选择 **安装**。
3. 安装完成后选择 **启用**。

### 手动安装

1. 从[最新版本](https://github.com/blank247d/sectioned-sidebar/releases/latest)下载 `main.js`、`manifest.json` 和 `styles.css`。
2. 在 Obsidian 仓库中创建 `.obsidian/plugins/sectioned-sidebar/` 目录。
3. 将下载的三个文件复制到该目录。
4. 重新加载 Obsidian，打开 **设置 → 第三方插件**，然后启用 **Sectioned Sidebar**。

插件 ID 为 `sectioned-sidebar`。如果你曾通过 `.obsidian/plugins/notion-navigation/` 或 `.obsidian/plugins/sidebar-navigation/` 测试早期预发布版本，请先关闭 Obsidian，再将该文件夹重命名为 `sectioned-sidebar`。保留重命名后文件夹中的 `data.json`，以继续使用原有导航设置。

在 **设置 → Sectioned Sidebar → 语言** 中选择 **跟随 Obsidian**、**简体中文** 或 **English**。更改界面语言不会重命名已有的自定义分区。

## 数据模型

分区与固定路径保存在插件的 `data.json` 中。重新排序、在分区之间移动、展开、折叠或移除导航项目时，只会修改这份配置。只有明确选择文件管理操作时，插件才会修改真实文件。

## 常见问题

### 可以在不移动文件的情况下整理笔记吗？

可以。Sectioned Sidebar 保存的是已有笔记和文件夹的引用。固定、排序或在虚拟分区之间移动项目，不会改变它在仓库中的真实路径。

### 可以在 Obsidian 中创建 Notion 风格的侧边栏分区吗？

可以。分区名称、顺序、内容和折叠状态均可自定义。分区本身是虚拟的，其中每个固定项目仍对应真实的 Obsidian 文件或文件夹。

### Sectioned Sidebar 会替代 Obsidian 原生文件管理器吗？

不会。自定义导航和原生文件管理器会保留在同一个左侧边栏标签组中，你可以在整理后的导航与完整仓库目录树之间切换。

### 重命名或删除真实文件时会发生什么？

插件会跟随 Obsidian 的重命名事件更新固定路径。当 Obsidian 确认真实笔记或文件夹已被删除时，插件会移除对应的导航引用。

### 支持哪些界面语言？

Sectioned Sidebar 支持简体中文和英文，也可以自动跟随 Obsidian 的界面语言。

## 开发

插件直接以 JavaScript 和 CSS 分发，无须构建步骤。

```bash
node --check main.js
```

## 发布来源证明

每次发布 GitHub Release 后，GitHub Actions 都会为 `main.js`、`manifest.json` 和 `styles.css` 生成已签名的构建来源证明。签名前，工作流会验证下载的每个发布资产是否与对应发布标签中的文件完全一致。

使用 GitHub CLI 验证已下载的资产：

```bash
gh attestation verify main.js --repo blank247d/sectioned-sidebar
```

如需为已有版本补充来源证明，请在 Actions 页面运行 **Attest release assets**，并提供对应标签。

## 参与贡献

欢迎提交错误报告、功能建议、文档改进和代码贡献。创建 Issue 或 Pull Request 前，请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

[MIT](LICENSE) © 2026 blank247d
