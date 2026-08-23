const {
  FuzzySuggestModal,
  ItemView,
  Menu,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  normalizePath,
  setIcon,
} = require("obsidian");

const VIEW_TYPE = "notion-navigation-view";
const LEADING_EMOJI_RE = /^((?:\p{Regional_Indicator}{2}|\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\uFE0F|\uFE0E)?(?:\u200D(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\uFE0F|\uFE0E)?)*)\s*/u;
const DEFAULT_SECTION_ICONS = {
  最爱: "star",
  共享: "users",
  私人: "lock",
  其他: "archive",
};
const ICON_CHOICES = {
  star: "星标",
  users: "共享",
  lock: "私人",
  folder: "文件夹",
  home: "主页",
  briefcase: "工作",
  globe: "公开",
  archive: "归档",
  heart: "喜爱",
  "book-open": "知识库",
};

function createId(prefix = "section") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function uniquePaths(paths) {
  return [...new Set(paths.filter(Boolean))];
}

class NameModal extends Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("notion-navigation-modal");
    contentEl.createEl("h2", { text: this.options.title });
    if (this.options.description) {
      contentEl.createEl("p", {
        cls: "notion-navigation-modal-description",
        text: this.options.description,
      });
    }

    let value = this.options.initialValue || "";
    const setting = new Setting(contentEl).setName(this.options.label || "名称");
    setting.addText((text) => {
      text.setValue(value).setPlaceholder(this.options.placeholder || "");
      text.onChange((next) => (value = next));
      window.setTimeout(() => {
        text.inputEl.focus();
        text.inputEl.select();
      }, 0);
      text.inputEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter") void submit();
      });
    });

    const actions = contentEl.createDiv({ cls: "notion-navigation-modal-actions" });
    const cancel = actions.createEl("button", { text: "取消" });
    cancel.addEventListener("click", () => this.close());
    const confirm = actions.createEl("button", { cls: "mod-cta", text: this.options.confirmText || "保存" });
    confirm.addEventListener("click", () => void submit());

    const submit = async () => {
      const trimmed = value.trim();
      if (!trimmed) {
        new Notice("名称不能为空");
        return;
      }
      const accepted = await this.options.onSubmit(trimmed);
      if (accepted !== false) this.close();
    };
  }

  onClose() {
    this.contentEl.empty();
  }
}

class ConfirmModal extends Modal {
  constructor(app, options) {
    super(app);
    this.options = options;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("notion-navigation-modal");
    contentEl.createEl("h2", { text: this.options.title });
    contentEl.createEl("p", {
      cls: "notion-navigation-modal-description",
      text: this.options.description,
    });
    const actions = contentEl.createDiv({ cls: "notion-navigation-modal-actions" });
    actions.createEl("button", { text: "取消" }).addEventListener("click", () => this.close());
    actions
      .createEl("button", { cls: "mod-warning", text: this.options.confirmText || "确认" })
      .addEventListener("click", async () => {
        await this.options.onConfirm();
        this.close();
      });
  }

  onClose() {
    this.contentEl.empty();
  }
}

class VaultItemSuggestModal extends FuzzySuggestModal {
  constructor(app, plugin, sectionId) {
    super(app);
    this.plugin = plugin;
    this.sectionId = sectionId;
    this.setPlaceholder("搜索要加入导航的文件夹或笔记…");
  }

  getItems() {
    const section = this.plugin.getSection(this.sectionId);
    const existing = new Set(section?.items || []);
    return this.app.vault
      .getAllLoadedFiles()
      .filter((item) => item.path !== "/")
      .filter((item) => item instanceof TFolder || item instanceof TFile)
      .filter((item) => !item.path.startsWith("_raw/") && !item.path.startsWith("_assets/"))
      .filter((item) => !existing.has(item.path))
      .sort((left, right) => {
        if (left instanceof TFolder && right instanceof TFile) return -1;
        if (left instanceof TFile && right instanceof TFolder) return 1;
        return left.path.localeCompare(right.path, "zh-CN", { numeric: true });
      });
  }

  getItemText(item) {
    return item.path;
  }

  onChooseItem(item) {
    void this.plugin.addItemToSection(this.sectionId, item.path);
  }
}

class NotionNavigationView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "导航";
  }

  getIcon() {
    return "panel-left";
  }

  async onOpen() {
    this.plugin.navigationView = this;
    this.render();
  }

  async onClose() {
    if (this.plugin.navigationView === this) this.plugin.navigationView = null;
  }

  render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("notion-navigation-view");

    const toolbar = contentEl.createDiv({ cls: "notion-navigation-toolbar" });
    const title = toolbar.createDiv({ cls: "notion-navigation-title" });
    const mark = title.createSpan({ cls: "notion-navigation-mark" });
    setIcon(mark, "panel-left");
    title.createSpan({ text: "导航" });

    const toolbarActions = toolbar.createDiv({ cls: "notion-navigation-toolbar-actions" });
    this.createIconButton(toolbarActions, "plus", "新建一级分区", (event) => {
      event.stopPropagation();
      this.plugin.promptCreateSection();
    });
    this.createIconButton(toolbarActions, "settings", "导航设置", () => {
      this.app.setting.open();
      this.app.setting.openTabById(this.plugin.manifest.id);
    });

    const sectionsEl = contentEl.createDiv({ cls: "notion-navigation-sections" });
    for (const section of this.plugin.settings.sections) {
      this.renderSection(sectionsEl, section);
    }
  }

  createIconButton(parent, icon, label, callback) {
    const button = parent.createEl("button", {
      cls: "notion-navigation-icon-button clickable-icon",
      attr: { "aria-label": label, type: "button" },
    });
    setIcon(button, icon);
    button.addEventListener("click", callback);
    return button;
  }

  renderSection(parent, section) {
    const sectionEl = parent.createDiv({ cls: "notion-navigation-section" });
    sectionEl.dataset.sectionId = section.id;

    const header = sectionEl.createDiv({
      cls: "notion-navigation-row notion-navigation-section-header",
      attr: { role: "button", tabindex: "0", "aria-expanded": String(!section.collapsed) },
    });

    const disclosure = header.createSpan({ cls: "notion-navigation-slot notion-navigation-disclosure" });
    setIcon(disclosure, section.collapsed ? "chevron-right" : "chevron-down");
    const icon = header.createSpan({ cls: "notion-navigation-slot notion-navigation-section-icon" });
    setIcon(icon, section.icon || "folder");
    header.createSpan({ cls: "notion-navigation-row-label", text: section.name });

    const actions = header.createDiv({ cls: "notion-navigation-row-actions" });
    this.createIconButton(actions, "plus", `在“${section.name}”中添加`, (event) => {
      event.stopPropagation();
      this.openAddMenu(section, event);
    });
    this.createIconButton(actions, "more-horizontal", `编辑“${section.name}”`, (event) => {
      event.stopPropagation();
      this.openSectionMenu(section, event);
    });

    const toggle = () => void this.plugin.toggleSection(section.id);
    header.addEventListener("click", (event) => {
      if (!event.target.closest("button")) toggle();
    });
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
    header.addEventListener("dblclick", (event) => {
      if (!event.target.closest("button")) this.plugin.promptRenameSection(section.id);
    });
    header.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.openSectionMenu(section, event);
    });

    if (section.collapsed) return;

    const body = sectionEl.createDiv({ cls: "notion-navigation-section-body" });
    const validItems = uniquePaths(section.items || []);
    if (!validItems.length) {
      const empty = body.createEl("button", {
        cls: "notion-navigation-empty",
        text: "添加文件夹或笔记",
        attr: { type: "button" },
      });
      empty.addEventListener("click", (event) => this.openAddMenu(section, event));
      return;
    }

    for (const path of validItems) {
      const item = this.app.vault.getAbstractFileByPath(path);
      if (item) this.renderVaultItem(body, section, item, 0, true);
      else this.renderMissingItem(body, section, path);
    }
  }

  renderMissingItem(parent, section, path) {
    const row = parent.createDiv({ cls: "notion-navigation-row notion-navigation-item is-file is-missing" });
    row.style.setProperty("--nav-depth", "0");
    const icon = row.createSpan({ cls: "notion-navigation-slot" });
    setIcon(icon, "file-question");
    row.createSpan({ cls: "notion-navigation-row-label", text: path });
    const actions = row.createDiv({ cls: "notion-navigation-row-actions" });
    this.createIconButton(actions, "x", "移除失效项目", () => {
      void this.plugin.removeItemFromSection(section.id, path);
    });
  }

  renderVaultItem(parent, section, item, depth, pinnedRoot) {
    const isFolder = item instanceof TFolder;
    const isExpanded = isFolder && this.plugin.isFolderExpanded(item.path);
    const activeFile = this.app.workspace.getActiveFile();
    const isActive = item instanceof TFile && activeFile?.path === item.path;
    const containsActive = isFolder && activeFile?.path.startsWith(`${item.path}/`);

    const row = parent.createDiv({
      cls: `notion-navigation-row notion-navigation-item ${isFolder ? "is-folder" : "is-file"}${
        isActive ? " is-active" : ""
      }${containsActive ? " is-active-parent" : ""}`,
      attr: {
        role: "button",
        tabindex: "0",
        "aria-label": `${isFolder ? "文件夹" : "笔记"}: ${item.path}`,
        "aria-expanded": isFolder ? String(isExpanded) : null,
      },
    });
    row.style.setProperty("--nav-depth", String(depth));

    const presentation = this.presentationForItem(item, isExpanded);
    const disclosure = row.createSpan({ cls: "notion-navigation-slot notion-navigation-disclosure" });
    if (isFolder) setIcon(disclosure, isExpanded ? "chevron-down" : "chevron-right");
    const icon = row.createSpan({ cls: "notion-navigation-slot notion-navigation-item-icon" });
    if (presentation.emoji) {
      icon.addClass("notion-navigation-emoji");
      icon.setText(presentation.emoji);
    } else {
      setIcon(icon, presentation.icon);
    }
    row.createSpan({ cls: "notion-navigation-row-label", text: presentation.label });

    if (pinnedRoot) {
      const actions = row.createDiv({ cls: "notion-navigation-row-actions" });
      this.createIconButton(actions, "more-horizontal", `管理 ${item.name}`, (event) => {
        event.stopPropagation();
        this.openItemMenu(section, item, event);
      });
    }

    const activate = () => {
      if (isFolder) void this.plugin.toggleFolder(item.path);
      else void this.app.workspace.getLeaf(false).openFile(item);
    };
    row.addEventListener("click", (event) => {
      if (!event.target.closest("button")) activate();
    });
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
    row.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.openItemMenu(section, item, event, pinnedRoot);
    });

    if (isFolder && isExpanded) {
      const children = parent.createDiv({ cls: "notion-navigation-children" });
      children.style.setProperty("--nav-parent-depth", String(depth));
      for (const child of this.sortedChildren(item)) {
        this.renderVaultItem(children, section, child, depth + 1, false);
      }
    }
  }

  sortedChildren(folder) {
    return [...folder.children].sort((left, right) => {
      if (left instanceof TFolder && right instanceof TFile) return -1;
      if (left instanceof TFile && right instanceof TFolder) return 1;
      return left.name.localeCompare(right.name, "zh-CN", { numeric: true });
    });
  }

  labelForItem(item) {
    return item instanceof TFile ? item.basename : item.name;
  }

  presentationForItem(item, expanded) {
    const rawLabel = this.labelForItem(item);
    const emojiMatch = rawLabel.match(LEADING_EMOJI_RE);
    return {
      emoji: emojiMatch?.[1] || null,
      label: emojiMatch ? rawLabel.slice(emojiMatch[0].length) || rawLabel : rawLabel,
      icon: this.iconForItem(item, expanded),
    };
  }

  iconForItem(item, expanded) {
    if (item instanceof TFolder) return expanded ? "folder-open" : "folder";
    if (item.extension === "base") return "table-2";
    if (item.extension === "canvas") return "layout-dashboard";
    if (item.extension === "pdf") return "file-text";
    return "file";
  }

  openAddMenu(section, event) {
    const menu = new Menu();
    menu.addItem((item) =>
      item.setTitle("新建文件夹").setIcon("folder-plus").onClick(() => this.plugin.promptCreateFolder(section.id))
    );
    menu.addItem((item) =>
      item.setTitle("添加已有文件夹或笔记").setIcon("list-plus").onClick(() => {
        new VaultItemSuggestModal(this.app, this.plugin, section.id).open();
      })
    );
    const active = this.app.workspace.getActiveFile();
    if (active && !(section.items || []).includes(active.path)) {
      menu.addItem((item) =>
        item.setTitle("添加当前笔记").setIcon("file-plus").onClick(() => {
          void this.plugin.addItemToSection(section.id, active.path);
        })
      );
    }
    menu.showAtMouseEvent(event);
  }

  openSectionMenu(section, event) {
    const index = this.plugin.settings.sections.findIndex((candidate) => candidate.id === section.id);
    const menu = new Menu();
    menu.addItem((item) =>
      item.setTitle("新建文件夹").setIcon("folder-plus").onClick(() => this.plugin.promptCreateFolder(section.id))
    );
    menu.addItem((item) =>
      item.setTitle("添加已有项目").setIcon("list-plus").onClick(() => {
        new VaultItemSuggestModal(this.app, this.plugin, section.id).open();
      })
    );
    menu.addSeparator();
    menu.addItem((item) =>
      item.setTitle("重命名分区").setIcon("pencil").onClick(() => this.plugin.promptRenameSection(section.id))
    );
    menu.addItem((item) =>
      item
        .setTitle("上移")
        .setIcon("arrow-up")
        .setDisabled(index <= 0)
        .onClick(() => void this.plugin.moveSection(section.id, -1))
    );
    menu.addItem((item) =>
      item
        .setTitle("下移")
        .setIcon("arrow-down")
        .setDisabled(index >= this.plugin.settings.sections.length - 1)
        .onClick(() => void this.plugin.moveSection(section.id, 1))
    );
    menu.addSeparator();
    menu.addItem((item) =>
      item.setTitle("删除分区").setIcon("trash-2").onClick(() => this.plugin.confirmDeleteSection(section.id))
    );
    menu.showAtMouseEvent(event);
  }

  openItemMenu(section, item, event, pinnedRoot = true) {
    const menu = new Menu().addSections([
      "title",
      "open",
      "action-primary",
      "action",
      "info",
      "info.copy",
      "view",
      "system",
      "notion-navigation",
      "",
      "danger",
    ]);

    if (item instanceof TFile) {
      menu.addItem((entry) =>
        entry
          .setSection("open")
          .setTitle("在新标签页中打开")
          .setIcon("file-plus")
          .onClick(() => void this.app.workspace.openLinkText(item.path, "", "tab"))
      );
      menu.addItem((entry) =>
        entry
          .setSection("open")
          .setTitle("在新标签组中打开")
          .setIcon("separator-vertical")
          .onClick(() => void this.app.workspace.openLinkText(item.path, "", "split"))
      );
    } else {
      menu.addItem((entry) =>
        entry
          .setSection("action-primary")
          .setTitle("新建笔记")
          .setIcon("edit")
          .onClick(() => void this.createNoteInFolder(item))
      );
      menu.addItem((entry) =>
        entry
          .setSection("action-primary")
          .setTitle("新建文件夹")
          .setIcon("folder-open")
          .onClick(() => void this.createFolderInFolder(item))
      );
    }

    menu.addItem((entry) =>
      entry
        .setSection("action")
        .setTitle("创建副本")
        .setIcon("files")
        .onClick(() => void this.duplicateVaultItem(item))
    );
    menu.addItem((entry) =>
      entry
        .setSection("danger")
        .setTitle("重命名")
        .setIcon("edit-3")
        .onClick(() => void this.app.fileManager.promptForFileRename(item))
    );
    menu.addItem((entry) => {
      entry.setSection("danger").setTitle("删除").setIcon("trash-2").onClick(() => {
        void this.app.fileManager.promptForDeletion(item);
      });
      entry.setWarning?.(true);
    });

    // Core and community plugins populate the rest of the same File Explorer
    // menu (move, bookmarks, copy paths, Finder, Canvas, Bases, and more).
    this.app.workspace.trigger("file-menu", menu, item, "file-explorer-context-menu", null);
    this.appendNavigationItems(menu, section, item, pinnedRoot);
    if (event.currentTarget) menu.setParentElement(event.currentTarget);
    menu.showAtMouseEvent(event);
  }

  async createNoteInFolder(folder) {
    try {
      const file = await this.app.fileManager.createNewMarkdownFile(folder);
      await this.app.workspace.getLeaf(false).openFile(file, {
        active: true,
        state: { mode: "source" },
        eState: { rename: "all" },
      });
    } catch (error) {
      new Notice(`无法新建笔记：${error.message || error}`);
    }
  }

  async createFolderInFolder(folder) {
    try {
      const created = await this.app.fileManager.createNewFolder(folder);
      if (created) this.app.fileManager.promptForFileRename(created);
    } catch (error) {
      new Notice(`无法新建文件夹：${error.message || error}`);
    }
  }

  async duplicateVaultItem(item) {
    try {
      const path =
        item instanceof TFile
          ? this.app.vault.getAvailablePath(item.path.slice(0, -(item.extension.length + 1)), item.extension)
          : this.app.vault.getAvailablePath(item.path);
      const copy = await this.app.vault.copy(item, path);
      if (copy instanceof TFile) new Notice(`已创建副本：${copy.path}`);
    } catch (error) {
      new Notice(`无法创建副本：${error.message || error}`);
    }
  }

  appendNavigationItems(menu, section, item, pinnedRoot = true) {
    const path = item.path;
    const index = (section.items || []).indexOf(path);
    menu.addSections?.(["notion-navigation"]);
    menu.setSectionSubmenu?.("notion-navigation", {
      title: "导航管理",
      icon: "panel-left",
    });

    const inNavigationSection = (entry) => entry.setSection?.("notion-navigation") || entry;
    if (item instanceof TFolder) {
      menu.addItem((entry) => {
        inNavigationSection(entry);
        return entry
          .setTitle(this.plugin.isFolderExpanded(path) ? "收起文件夹" : "展开文件夹")
          .setIcon(this.plugin.isFolderExpanded(path) ? "folder-closed" : "folder-open")
          .onClick(() => void this.plugin.toggleFolder(path));
      });
    }

    if (pinnedRoot) {
      menu.addItem((entry) => {
        inNavigationSection(entry);
        return entry
          .setTitle("上移")
          .setIcon("arrow-up")
          .setDisabled(index <= 0)
          .onClick(() => void this.plugin.moveItem(section.id, path, -1));
      });
      menu.addItem((entry) => {
        inNavigationSection(entry);
        return entry
          .setTitle("下移")
          .setIcon("arrow-down")
          .setDisabled(index >= section.items.length - 1)
          .onClick(() => void this.plugin.moveItem(section.id, path, 1));
      });
      for (const target of this.plugin.settings.sections.filter((candidate) => candidate.id !== section.id)) {
        menu.addItem((entry) => {
          inNavigationSection(entry);
          return entry.setTitle(`移到“${target.name}”`).setIcon(target.icon || "folder").onClick(() => {
            void this.plugin.moveItemToSection(section.id, target.id, path);
          });
        });
      }
      menu.addItem((entry) => {
        inNavigationSection(entry);
        return entry.setTitle("从导航移除").setIcon("x").onClick(() => {
          void this.plugin.removeItemFromSection(section.id, path);
        });
      });
    }
  }
}

class NotionNavigationSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Sidebar Navigation" });
    containerEl.createEl("p", {
      text: "一级分区只属于导航，不改变真实文件路径。二级项目始终指向仓库中的真实文件夹或笔记。",
    });

    new Setting(containerEl)
      .setName("启动时打开导航")
      .setDesc("在左侧栏创建并显示导航标签，同时保留原生文件列表。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoOpen).onChange(async (value) => {
          this.plugin.settings.autoOpen = value;
          await this.plugin.persist();
        })
      );

    containerEl.createEl("h3", { text: "一级分区" });
    for (const section of this.plugin.settings.sections) {
      const index = this.plugin.settings.sections.indexOf(section);
      const setting = new Setting(containerEl)
        .setName(section.name)
        .setDesc(`${(section.items || []).length} 个导航项目`);
      setting.addText((text) =>
        text.setValue(section.name).setPlaceholder("分区名称").onChange(async (value) => {
          const trimmed = value.trim();
          if (!trimmed) return;
          section.name = trimmed;
          await this.plugin.persist();
        })
      );
      setting.addDropdown((dropdown) => {
        for (const [value, label] of Object.entries(ICON_CHOICES)) dropdown.addOption(value, label);
        dropdown.setValue(section.icon || "folder").onChange(async (value) => {
          section.icon = value;
          await this.plugin.persist();
        });
      });
      setting.addExtraButton((button) =>
        button
          .setIcon("arrow-up")
          .setTooltip("上移")
          .setDisabled(index === 0)
          .onClick(async () => {
            await this.plugin.moveSection(section.id, -1);
            this.display();
          })
      );
      setting.addExtraButton((button) =>
        button
          .setIcon("arrow-down")
          .setTooltip("下移")
          .setDisabled(index === this.plugin.settings.sections.length - 1)
          .onClick(async () => {
            await this.plugin.moveSection(section.id, 1);
            this.display();
          })
      );
      setting.addExtraButton((button) =>
        button.setIcon("trash-2").setTooltip("删除分区").onClick(() => {
          this.plugin.confirmDeleteSection(section.id, () => this.display());
        })
      );
    }

    new Setting(containerEl)
      .setName("添加一级分区")
      .setDesc("分区名称和图标之后都可以修改。")
      .addButton((button) =>
        button.setButtonText("添加分区").setCta().onClick(() => {
          this.plugin.promptCreateSection(() => this.display());
        })
      );
  }
}

module.exports = class NotionNavigationPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE, (leaf) => new NotionNavigationView(leaf, this));
    this.addSettingTab(new NotionNavigationSettingTab(this.app, this));

    this.addRibbonIcon("panel-left", "打开侧边栏导航", () => void this.activateView());
    this.addCommand({
      id: "open-navigation",
      name: "打开导航",
      callback: () => void this.activateView(),
    });
    this.addCommand({
      id: "add-section",
      name: "添加一级分区",
      callback: () => this.promptCreateSection(),
    });
    this.addCommand({
      id: "add-active-file",
      name: "把当前笔记加入导航",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;
        if (!checking) this.openSectionPicker(file.path);
        return true;
      },
    });

    this.registerEvent(this.app.workspace.on("file-open", () => this.refreshView()));
    this.registerEvent(this.app.vault.on("create", () => this.refreshView()));
    this.registerEvent(this.app.vault.on("delete", () => this.refreshView()));
    this.registerEvent(
      this.app.vault.on("rename", (item, oldPath) => {
        void this.handleRename(item.path, oldPath);
      })
    );

    this.app.workspace.onLayoutReady(() => {
      if (this.settings.autoOpen) void this.activateView();
    });
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async loadSettings() {
    const stored = await this.loadData();
    if (stored?.sections?.length) {
      this.settings = {
        autoOpen: stored.autoOpen !== false,
        expandedFolders: uniquePaths(stored.expandedFolders || []),
        sections: stored.sections.map((section) => ({
          id: section.id || createId(),
          name: section.name || "未命名",
          icon: section.icon || "folder",
          collapsed: Boolean(section.collapsed),
          items: uniquePaths(section.items || []),
        })),
      };
    } else {
      this.settings = this.createDefaultSettings();
      await this.saveData(this.settings);
    }
    this.expandedFolders = new Set(this.settings.expandedFolders || []);
  }

  createDefaultSettings() {
    const root = this.app.vault.getRoot();
    const privateFolders = root.children
      .filter((item) => item instanceof TFolder)
      .filter((folder) => !folder.name.startsWith("_"))
      .map((folder) => folder.path)
      .sort((left, right) => left.localeCompare(right, "zh-CN", { numeric: true }));

    return {
      autoOpen: true,
      expandedFolders: [],
      sections: [
        {
          id: createId(),
          name: "最爱",
          icon: DEFAULT_SECTION_ICONS.最爱,
          collapsed: false,
          items: [],
        },
        { id: createId(), name: "共享", icon: DEFAULT_SECTION_ICONS.共享, collapsed: false, items: [] },
        {
          id: createId(),
          name: "私人",
          icon: DEFAULT_SECTION_ICONS.私人,
          collapsed: false,
          items: privateFolders,
        },
        {
          id: createId(),
          name: "其他",
          icon: DEFAULT_SECTION_ICONS.其他,
          collapsed: false,
          items: [],
        },
      ],
    };
  }

  async persist() {
    this.settings.expandedFolders = [...this.expandedFolders];
    await this.saveData(this.settings);
    this.refreshView();
  }

  refreshView() {
    this.navigationView?.render();
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    const fileExplorerLeaf = this.app.workspace.getLeavesOfType("file-explorer")[0];

    // Keep the custom navigation beside Obsidian's native file explorer as a
    // tab, not as a second vertical split. Also repair layouts created by
    // earlier versions of this plugin.
    if (leaf && fileExplorerLeaf && leaf.parent !== fileExplorerLeaf.parent) {
      leaf.detach();
      leaf = null;
    }

    if (!leaf) {
      leaf = this.app.workspace.getLeftLeaf(false);
      if (!leaf) {
        new Notice("无法创建左侧导航标签");
        return;
      }
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
  }

  getSection(sectionId) {
    return this.settings.sections.find((section) => section.id === sectionId);
  }

  promptCreateSection(afterCreate) {
    new NameModal(this.app, {
      title: "新建一级分区",
      label: "分区名称",
      placeholder: "例如：学习、工作、归档",
      confirmText: "创建",
      onSubmit: async (name) => {
        this.settings.sections.push({
          id: createId(),
          name,
          icon: "folder",
          collapsed: false,
          items: [],
        });
        await this.persist();
        afterCreate?.();
      },
    }).open();
  }

  promptRenameSection(sectionId) {
    const section = this.getSection(sectionId);
    if (!section) return;
    new NameModal(this.app, {
      title: "重命名一级分区",
      label: "分区名称",
      initialValue: section.name,
      confirmText: "重命名",
      onSubmit: async (name) => {
        section.name = name;
        await this.persist();
      },
    }).open();
  }

  confirmDeleteSection(sectionId, afterDelete) {
    const section = this.getSection(sectionId);
    if (!section) return;
    new ConfirmModal(this.app, {
      title: `删除“${section.name}”？`,
      description: "只会删除导航分区及其中的固定项，不会删除或移动任何真实文件。",
      confirmText: "删除分区",
      onConfirm: async () => {
        this.settings.sections = this.settings.sections.filter((candidate) => candidate.id !== sectionId);
        await this.persist();
        afterDelete?.();
      },
    }).open();
  }

  async toggleSection(sectionId) {
    const section = this.getSection(sectionId);
    if (!section) return;
    section.collapsed = !section.collapsed;
    await this.persist();
  }

  isFolderExpanded(path) {
    return this.expandedFolders.has(path);
  }

  async toggleFolder(path) {
    if (this.expandedFolders.has(path)) this.expandedFolders.delete(path);
    else this.expandedFolders.add(path);
    await this.persist();
  }

  promptCreateFolder(sectionId) {
    const section = this.getSection(sectionId);
    if (!section) return;
    new NameModal(this.app, {
      title: `在“${section.name}”中新建文件夹`,
      description: "文件夹会创建在 Obsidian 仓库根目录；导航分区本身不会成为真实路径。",
      label: "文件夹名称",
      placeholder: "例如：新项目",
      confirmText: "创建文件夹",
      onSubmit: async (name) => {
        if (/[\\/:*?"<>|]/.test(name)) {
          new Notice("文件夹名称不能包含路径或系统保留字符");
          return false;
        }
        const path = normalizePath(name);
        if (this.app.vault.getAbstractFileByPath(path)) {
          new Notice("仓库根目录中已存在同名项目");
          return false;
        }
        await this.app.vault.createFolder(path);
        await this.addItemToSection(sectionId, path);
        new Notice(`已创建文件夹：${path}`);
        return true;
      },
    }).open();
  }

  async addItemToSection(sectionId, path) {
    const section = this.getSection(sectionId);
    if (!section) return;
    section.items = uniquePaths([...(section.items || []), path]);
    await this.persist();
  }

  async removeItemFromSection(sectionId, path) {
    const section = this.getSection(sectionId);
    if (!section) return;
    section.items = (section.items || []).filter((itemPath) => itemPath !== path);
    await this.persist();
  }

  async moveItem(sectionId, path, direction) {
    const section = this.getSection(sectionId);
    if (!section) return;
    const index = section.items.indexOf(path);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= section.items.length) return;
    [section.items[index], section.items[target]] = [section.items[target], section.items[index]];
    await this.persist();
  }

  async moveItemToSection(sourceId, targetId, path) {
    const source = this.getSection(sourceId);
    const target = this.getSection(targetId);
    if (!source || !target) return;
    source.items = source.items.filter((itemPath) => itemPath !== path);
    target.items = uniquePaths([...(target.items || []), path]);
    await this.persist();
  }

  async moveSection(sectionId, direction) {
    const index = this.settings.sections.findIndex((section) => section.id === sectionId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= this.settings.sections.length) return;
    [this.settings.sections[index], this.settings.sections[target]] = [
      this.settings.sections[target],
      this.settings.sections[index],
    ];
    await this.persist();
  }

  openSectionPicker(path) {
    const menu = new Menu();
    for (const section of this.settings.sections) {
      menu.addItem((item) =>
        item.setTitle(section.name).setIcon(section.icon || "folder").onClick(() => {
          void this.addItemToSection(section.id, path);
        })
      );
    }
    const activeElement = document.activeElement;
    const rect = activeElement?.getBoundingClientRect?.();
    menu.showAtPosition({ x: rect?.left || 80, y: rect?.bottom || 80 });
  }

  async handleRename(newPath, oldPath) {
    let changed = false;
    for (const section of this.settings.sections) {
      section.items = (section.items || []).map((path) => {
        if (path === oldPath) {
          changed = true;
          return newPath;
        }
        if (path.startsWith(`${oldPath}/`)) {
          changed = true;
          return `${newPath}${path.slice(oldPath.length)}`;
        }
        return path;
      });
    }

    const expanded = new Set();
    for (const path of this.expandedFolders) {
      if (path === oldPath) {
        expanded.add(newPath);
        changed = true;
      } else if (path.startsWith(`${oldPath}/`)) {
        expanded.add(`${newPath}${path.slice(oldPath.length)}`);
        changed = true;
      } else expanded.add(path);
    }
    this.expandedFolders = expanded;
    if (changed) await this.persist();
    else this.refreshView();
  }
};
