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
  getLanguage,
  normalizePath,
  setIcon,
} = require("obsidian");

const VIEW_TYPE = "notion-navigation-view";
const LEADING_EMOJI_RE = /^((?:\p{Regional_Indicator}{2}|\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\uFE0F|\uFE0E)?(?:\u200D(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\uFE0F|\uFE0E)?)*)\s*/u;
const LANGUAGE_OPTIONS = new Set(["auto", "zh", "en"]);
const DEFAULT_SECTIONS = [
  { key: "defaultFavorites", icon: "star" },
  { key: "defaultShared", icon: "users" },
  { key: "defaultPersonal", icon: "lock", includeRootFolders: true },
  { key: "defaultOther", icon: "archive" },
];
const ICON_CHOICES = {
  star: "iconStar",
  users: "iconShared",
  lock: "iconPrivate",
  folder: "iconFolder",
  home: "iconHome",
  briefcase: "iconWork",
  globe: "iconPublic",
  archive: "iconArchive",
  heart: "iconFavorite",
  "book-open": "iconKnowledgeBase",
};

const TRANSLATIONS = {
  zh: {
    name: "名称",
    cancel: "取消",
    save: "保存",
    confirm: "确认",
    nameRequired: "名称不能为空",
    searchAdd: "搜索要加入导航的文件夹或笔记…",
    navigation: "导航",
    newSection: "新建一级分区",
    navigationSettings: "导航设置",
    addToSection: "在“{name}”中添加",
    editSection: "编辑“{name}”",
    addFolderOrNote: "添加文件夹或笔记",
    removeMissingItem: "移除失效项目",
    folder: "文件夹",
    note: "笔记",
    manageItem: "管理 {name}",
    newFolder: "新建文件夹",
    addExistingFolderOrNote: "添加已有文件夹或笔记",
    addCurrentNote: "添加当前笔记",
    addExistingItem: "添加已有项目",
    renameSection: "重命名分区",
    moveUp: "上移",
    moveDown: "下移",
    deleteSection: "删除分区",
    openInNewTab: "在新标签页中打开",
    openInNewPane: "在新标签组中打开",
    newNote: "新建笔记",
    duplicate: "创建副本",
    rename: "重命名",
    delete: "删除",
    cannotCreateNote: "无法新建笔记：{error}",
    cannotCreateFolder: "无法新建文件夹：{error}",
    copyCreated: "已创建副本：{path}",
    cannotCreateCopy: "无法创建副本：{error}",
    navigationManagement: "导航管理",
    collapseFolder: "收起文件夹",
    expandFolder: "展开文件夹",
    moveToSection: "移到“{name}”",
    removeFromNavigation: "从导航移除",
    settingsIntro: "一级分区只属于导航，不改变真实文件路径。二级项目始终指向仓库中的真实文件夹或笔记。",
    language: "语言",
    languageDesc: "跟随 Obsidian，或手动选择插件界面语言。自定义分区名称不会被翻译。",
    followObsidian: "跟随 Obsidian",
    simplifiedChinese: "简体中文",
    english: "English",
    openAtStartup: "启动时打开导航",
    openAtStartupDesc: "在左侧栏创建并显示导航标签，同时保留原生文件列表。",
    topLevelSections: "一级分区",
    navigationItemCountOne: "{count} 个导航项目",
    navigationItemCountOther: "{count} 个导航项目",
    sectionName: "分区名称",
    iconStar: "星标",
    iconShared: "共享",
    iconPrivate: "私人",
    iconFolder: "文件夹",
    iconHome: "主页",
    iconWork: "工作",
    iconPublic: "公开",
    iconArchive: "归档",
    iconFavorite: "喜爱",
    iconKnowledgeBase: "知识库",
    addTopLevelSection: "添加一级分区",
    addTopLevelSectionDesc: "分区名称和图标之后都可以修改。",
    addSection: "添加分区",
    openSidebarNavigation: "打开侧边栏导航",
    openNavigation: "打开导航",
    addCurrentNoteToNavigation: "把当前笔记加入导航",
    unnamed: "未命名",
    defaultFavorites: "最爱",
    defaultShared: "共享",
    defaultPersonal: "私人",
    defaultOther: "其他",
    cannotCreateSidebar: "无法创建左侧导航标签",
    createSectionTitle: "新建一级分区",
    sectionNamePlaceholder: "例如：学习、工作、归档",
    create: "创建",
    renameSectionTitle: "重命名一级分区",
    deleteSectionTitle: "删除“{name}”？",
    deleteSectionDescription: "只会删除导航分区及其中的固定项，不会删除或移动任何真实文件。",
    createFolderInSectionTitle: "在“{name}”中新建文件夹",
    createFolderDescription: "文件夹会创建在 Obsidian 仓库根目录；导航分区本身不会成为真实路径。",
    folderName: "文件夹名称",
    folderNamePlaceholder: "例如：新项目",
    createFolder: "创建文件夹",
    invalidFolderName: "文件夹名称不能包含路径或系统保留字符",
    duplicateRootItem: "仓库根目录中已存在同名项目",
    folderCreated: "已创建文件夹：{path}",
  },
  en: {
    name: "Name",
    cancel: "Cancel",
    save: "Save",
    confirm: "Confirm",
    nameRequired: "Name cannot be empty",
    searchAdd: "Search for a folder or note to add…",
    navigation: "Navigation",
    newSection: "New top-level section",
    navigationSettings: "Navigation settings",
    addToSection: "Add to “{name}”",
    editSection: "Edit “{name}”",
    addFolderOrNote: "Add a folder or note",
    removeMissingItem: "Remove missing item",
    folder: "Folder",
    note: "Note",
    manageItem: "Manage {name}",
    newFolder: "New folder",
    addExistingFolderOrNote: "Add existing folder or note",
    addCurrentNote: "Add current note",
    addExistingItem: "Add existing item",
    renameSection: "Rename section",
    moveUp: "Move up",
    moveDown: "Move down",
    deleteSection: "Delete section",
    openInNewTab: "Open in new tab",
    openInNewPane: "Open in new pane",
    newNote: "New note",
    duplicate: "Make a copy",
    rename: "Rename",
    delete: "Delete",
    cannotCreateNote: "Could not create note: {error}",
    cannotCreateFolder: "Could not create folder: {error}",
    copyCreated: "Copy created: {path}",
    cannotCreateCopy: "Could not create copy: {error}",
    navigationManagement: "Navigation management",
    collapseFolder: "Collapse folder",
    expandFolder: "Expand folder",
    moveToSection: "Move to “{name}”",
    removeFromNavigation: "Remove from navigation",
    settingsIntro: "Top-level sections exist only in navigation and do not change real file paths. Their items always point to real folders or notes in the vault.",
    language: "Language",
    languageDesc: "Follow Obsidian or choose the plugin interface language. Custom section names are never translated.",
    followObsidian: "Follow Obsidian",
    simplifiedChinese: "简体中文",
    english: "English",
    openAtStartup: "Open navigation on startup",
    openAtStartupDesc: "Create and show the Navigation tab in the left sidebar while keeping the native File Explorer available.",
    topLevelSections: "Top-level sections",
    navigationItemCountOne: "{count} navigation item",
    navigationItemCountOther: "{count} navigation items",
    sectionName: "Section name",
    iconStar: "Star",
    iconShared: "Shared",
    iconPrivate: "Private",
    iconFolder: "Folder",
    iconHome: "Home",
    iconWork: "Work",
    iconPublic: "Public",
    iconArchive: "Archive",
    iconFavorite: "Favorite",
    iconKnowledgeBase: "Knowledge base",
    addTopLevelSection: "Add top-level section",
    addTopLevelSectionDesc: "You can change the section name and icon later.",
    addSection: "Add section",
    openSidebarNavigation: "Open Sidebar Navigation",
    openNavigation: "Open navigation",
    addCurrentNoteToNavigation: "Add current note to navigation",
    unnamed: "Untitled",
    defaultFavorites: "Favorites",
    defaultShared: "Shared",
    defaultPersonal: "Personal",
    defaultOther: "Other",
    cannotCreateSidebar: "Could not create the Navigation tab",
    createSectionTitle: "New top-level section",
    sectionNamePlaceholder: "For example: Study, Work, Archive",
    create: "Create",
    renameSectionTitle: "Rename top-level section",
    deleteSectionTitle: "Delete “{name}”?",
    deleteSectionDescription: "This removes only the navigation section and its pinned items. It will not delete or move any real files.",
    createFolderInSectionTitle: "Create a folder in “{name}”",
    createFolderDescription: "The folder will be created at the vault root. Navigation sections do not become real paths.",
    folderName: "Folder name",
    folderNamePlaceholder: "For example: New project",
    createFolder: "Create folder",
    invalidFolderName: "Folder names cannot contain path separators or reserved system characters",
    duplicateRootItem: "An item with that name already exists at the vault root",
    folderCreated: "Folder created: {path}",
  },
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
    const t = this.options.t;
    contentEl.addClass("notion-navigation-modal");
    contentEl.createEl("h2", { text: this.options.title });
    if (this.options.description) {
      contentEl.createEl("p", {
        cls: "notion-navigation-modal-description",
        text: this.options.description,
      });
    }

    let value = this.options.initialValue || "";
    const setting = new Setting(contentEl).setName(this.options.label || t("name"));
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
    const cancel = actions.createEl("button", { text: t("cancel") });
    cancel.addEventListener("click", () => this.close());
    const confirm = actions.createEl("button", { cls: "mod-cta", text: this.options.confirmText || t("save") });
    confirm.addEventListener("click", () => void submit());

    const submit = async () => {
      const trimmed = value.trim();
      if (!trimmed) {
        new Notice(t("nameRequired"));
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
    const t = this.options.t;
    contentEl.addClass("notion-navigation-modal");
    contentEl.createEl("h2", { text: this.options.title });
    contentEl.createEl("p", {
      cls: "notion-navigation-modal-description",
      text: this.options.description,
    });
    const actions = contentEl.createDiv({ cls: "notion-navigation-modal-actions" });
    actions.createEl("button", { text: t("cancel") }).addEventListener("click", () => this.close());
    actions
      .createEl("button", { cls: "mod-warning", text: this.options.confirmText || t("confirm") })
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
    this.setPlaceholder(this.plugin.t("searchAdd"));
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
        return left.path.localeCompare(right.path, this.plugin.getSortLocale(), { numeric: true });
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
    return this.plugin.t("navigation");
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
    title.createSpan({ text: this.plugin.t("navigation") });

    const toolbarActions = toolbar.createDiv({ cls: "notion-navigation-toolbar-actions" });
    this.createIconButton(toolbarActions, "plus", this.plugin.t("newSection"), (event) => {
      event.stopPropagation();
      this.plugin.promptCreateSection();
    });
    this.createIconButton(toolbarActions, "settings", this.plugin.t("navigationSettings"), () => {
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
    this.createIconButton(actions, "plus", this.plugin.t("addToSection", { name: section.name }), (event) => {
      event.stopPropagation();
      this.openAddMenu(section, event);
    });
    this.createIconButton(actions, "more-horizontal", this.plugin.t("editSection", { name: section.name }), (event) => {
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
        text: this.plugin.t("addFolderOrNote"),
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
    this.createIconButton(actions, "x", this.plugin.t("removeMissingItem"), () => {
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
        "aria-label": `${this.plugin.t(isFolder ? "folder" : "note")}: ${item.path}`,
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
      this.createIconButton(actions, "more-horizontal", this.plugin.t("manageItem", { name: item.name }), (event) => {
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
      return left.name.localeCompare(right.name, this.plugin.getSortLocale(), { numeric: true });
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
      item.setTitle(this.plugin.t("newFolder")).setIcon("folder-plus").onClick(() => this.plugin.promptCreateFolder(section.id))
    );
    menu.addItem((item) =>
      item.setTitle(this.plugin.t("addExistingFolderOrNote")).setIcon("list-plus").onClick(() => {
        new VaultItemSuggestModal(this.app, this.plugin, section.id).open();
      })
    );
    const active = this.app.workspace.getActiveFile();
    if (active && !(section.items || []).includes(active.path)) {
      menu.addItem((item) =>
        item.setTitle(this.plugin.t("addCurrentNote")).setIcon("file-plus").onClick(() => {
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
      item.setTitle(this.plugin.t("newFolder")).setIcon("folder-plus").onClick(() => this.plugin.promptCreateFolder(section.id))
    );
    menu.addItem((item) =>
      item.setTitle(this.plugin.t("addExistingItem")).setIcon("list-plus").onClick(() => {
        new VaultItemSuggestModal(this.app, this.plugin, section.id).open();
      })
    );
    menu.addSeparator();
    menu.addItem((item) =>
      item.setTitle(this.plugin.t("renameSection")).setIcon("pencil").onClick(() => this.plugin.promptRenameSection(section.id))
    );
    menu.addItem((item) =>
      item
        .setTitle(this.plugin.t("moveUp"))
        .setIcon("arrow-up")
        .setDisabled(index <= 0)
        .onClick(() => void this.plugin.moveSection(section.id, -1))
    );
    menu.addItem((item) =>
      item
        .setTitle(this.plugin.t("moveDown"))
        .setIcon("arrow-down")
        .setDisabled(index >= this.plugin.settings.sections.length - 1)
        .onClick(() => void this.plugin.moveSection(section.id, 1))
    );
    menu.addSeparator();
    menu.addItem((item) =>
      item.setTitle(this.plugin.t("deleteSection")).setIcon("trash-2").onClick(() => this.plugin.confirmDeleteSection(section.id))
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
          .setTitle(this.plugin.t("openInNewTab"))
          .setIcon("file-plus")
          .onClick(() => void this.app.workspace.openLinkText(item.path, "", "tab"))
      );
      menu.addItem((entry) =>
        entry
          .setSection("open")
          .setTitle(this.plugin.t("openInNewPane"))
          .setIcon("separator-vertical")
          .onClick(() => void this.app.workspace.openLinkText(item.path, "", "split"))
      );
    } else {
      menu.addItem((entry) =>
        entry
          .setSection("action-primary")
          .setTitle(this.plugin.t("newNote"))
          .setIcon("edit")
          .onClick(() => void this.createNoteInFolder(item))
      );
      menu.addItem((entry) =>
        entry
          .setSection("action-primary")
          .setTitle(this.plugin.t("newFolder"))
          .setIcon("folder-open")
          .onClick(() => void this.createFolderInFolder(item))
      );
    }

    menu.addItem((entry) =>
      entry
        .setSection("action")
        .setTitle(this.plugin.t("duplicate"))
        .setIcon("files")
        .onClick(() => void this.duplicateVaultItem(item))
    );
    menu.addItem((entry) =>
      entry
        .setSection("danger")
        .setTitle(this.plugin.t("rename"))
        .setIcon("edit-3")
        .onClick(() => void this.app.fileManager.promptForFileRename(item))
    );
    menu.addItem((entry) => {
      entry.setSection("danger").setTitle(this.plugin.t("delete")).setIcon("trash-2").onClick(() => {
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
      new Notice(this.plugin.t("cannotCreateNote", { error: error.message || error }));
    }
  }

  async createFolderInFolder(folder) {
    try {
      const created = await this.app.fileManager.createNewFolder(folder);
      if (created) this.app.fileManager.promptForFileRename(created);
    } catch (error) {
      new Notice(this.plugin.t("cannotCreateFolder", { error: error.message || error }));
    }
  }

  async duplicateVaultItem(item) {
    try {
      const path =
        item instanceof TFile
          ? this.app.vault.getAvailablePath(item.path.slice(0, -(item.extension.length + 1)), item.extension)
          : this.app.vault.getAvailablePath(item.path);
      const copy = await this.app.vault.copy(item, path);
      if (copy instanceof TFile) new Notice(this.plugin.t("copyCreated", { path: copy.path }));
    } catch (error) {
      new Notice(this.plugin.t("cannotCreateCopy", { error: error.message || error }));
    }
  }

  appendNavigationItems(menu, section, item, pinnedRoot = true) {
    const path = item.path;
    const index = (section.items || []).indexOf(path);
    menu.addSections?.(["notion-navigation"]);
    menu.setSectionSubmenu?.("notion-navigation", {
      title: this.plugin.t("navigationManagement"),
      icon: "panel-left",
    });

    const inNavigationSection = (entry) => entry.setSection?.("notion-navigation") || entry;
    if (item instanceof TFolder) {
      menu.addItem((entry) => {
        inNavigationSection(entry);
        return entry
          .setTitle(this.plugin.t(this.plugin.isFolderExpanded(path) ? "collapseFolder" : "expandFolder"))
          .setIcon(this.plugin.isFolderExpanded(path) ? "folder-closed" : "folder-open")
          .onClick(() => void this.plugin.toggleFolder(path));
      });
    }

    if (pinnedRoot) {
      menu.addItem((entry) => {
        inNavigationSection(entry);
        return entry
          .setTitle(this.plugin.t("moveUp"))
          .setIcon("arrow-up")
          .setDisabled(index <= 0)
          .onClick(() => void this.plugin.moveItem(section.id, path, -1));
      });
      menu.addItem((entry) => {
        inNavigationSection(entry);
        return entry
          .setTitle(this.plugin.t("moveDown"))
          .setIcon("arrow-down")
          .setDisabled(index >= section.items.length - 1)
          .onClick(() => void this.plugin.moveItem(section.id, path, 1));
      });
      for (const target of this.plugin.settings.sections.filter((candidate) => candidate.id !== section.id)) {
        menu.addItem((entry) => {
          inNavigationSection(entry);
          return entry.setTitle(this.plugin.t("moveToSection", { name: target.name })).setIcon(target.icon || "folder").onClick(() => {
            void this.plugin.moveItemToSection(section.id, target.id, path);
          });
        });
      }
      menu.addItem((entry) => {
        inNavigationSection(entry);
        return entry.setTitle(this.plugin.t("removeFromNavigation")).setIcon("x").onClick(() => {
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
      text: this.plugin.t("settingsIntro"),
    });

    new Setting(containerEl)
      .setName(this.plugin.t("language"))
      .setDesc(this.plugin.t("languageDesc"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("auto", this.plugin.t("followObsidian"))
          .addOption("zh", this.plugin.t("simplifiedChinese"))
          .addOption("en", this.plugin.t("english"))
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            await this.plugin.setLanguage(value);
            this.display();
          })
      );

    new Setting(containerEl)
      .setName(this.plugin.t("openAtStartup"))
      .setDesc(this.plugin.t("openAtStartupDesc"))
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoOpen).onChange(async (value) => {
          this.plugin.settings.autoOpen = value;
          await this.plugin.persist();
        })
      );

    containerEl.createEl("h3", { text: this.plugin.t("topLevelSections") });
    for (const section of this.plugin.settings.sections) {
      const index = this.plugin.settings.sections.indexOf(section);
      const itemCount = (section.items || []).length;
      const setting = new Setting(containerEl)
        .setName(section.name)
        .setDesc(this.plugin.t(itemCount === 1 ? "navigationItemCountOne" : "navigationItemCountOther", {
          count: itemCount,
        }));
      setting.addText((text) =>
        text.setValue(section.name).setPlaceholder(this.plugin.t("sectionName")).onChange(async (value) => {
          const trimmed = value.trim();
          if (!trimmed) return;
          section.name = trimmed;
          await this.plugin.persist();
        })
      );
      setting.addDropdown((dropdown) => {
        for (const [value, labelKey] of Object.entries(ICON_CHOICES)) {
          dropdown.addOption(value, this.plugin.t(labelKey));
        }
        dropdown.setValue(section.icon || "folder").onChange(async (value) => {
          section.icon = value;
          await this.plugin.persist();
        });
      });
      setting.addExtraButton((button) =>
        button
          .setIcon("arrow-up")
          .setTooltip(this.plugin.t("moveUp"))
          .setDisabled(index === 0)
          .onClick(async () => {
            await this.plugin.moveSection(section.id, -1);
            this.display();
          })
      );
      setting.addExtraButton((button) =>
        button
          .setIcon("arrow-down")
          .setTooltip(this.plugin.t("moveDown"))
          .setDisabled(index === this.plugin.settings.sections.length - 1)
          .onClick(async () => {
            await this.plugin.moveSection(section.id, 1);
            this.display();
          })
      );
      setting.addExtraButton((button) =>
        button.setIcon("trash-2").setTooltip(this.plugin.t("deleteSection")).onClick(() => {
          this.plugin.confirmDeleteSection(section.id, () => this.display());
        })
      );
    }

    new Setting(containerEl)
      .setName(this.plugin.t("addTopLevelSection"))
      .setDesc(this.plugin.t("addTopLevelSectionDesc"))
      .addButton((button) =>
        button.setButtonText(this.plugin.t("addSection")).setCta().onClick(() => {
          this.plugin.promptCreateSection(() => this.display());
        })
      );
  }
}

module.exports = class NotionNavigationPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE, (leaf) => new NotionNavigationView(leaf, this));
    this.settingTab = new NotionNavigationSettingTab(this.app, this);
    this.addSettingTab(this.settingTab);

    this.ribbonIcon = this.addRibbonIcon("panel-left", this.t("openSidebarNavigation"), () =>
      void this.activateView()
    );
    this.localizedCommands = [];
    this.registerLocalizedCommand("openNavigation", {
      id: "open-navigation",
      callback: () => void this.activateView(),
    });
    this.registerLocalizedCommand("addTopLevelSection", {
      id: "add-section",
      callback: () => this.promptCreateSection(),
    });
    this.registerLocalizedCommand("addCurrentNoteToNavigation", {
      id: "add-active-file",
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
    const language = LANGUAGE_OPTIONS.has(stored?.language) ? stored.language : "auto";
    if (stored?.sections?.length) {
      this.settings = {
        language,
        autoOpen: stored.autoOpen !== false,
        expandedFolders: uniquePaths(stored.expandedFolders || []),
        sections: stored.sections.map((section) => ({
          id: section.id || createId(),
          name: section.name || this.translate(this.resolveLanguage(language), "unnamed"),
          icon: section.icon || "folder",
          collapsed: Boolean(section.collapsed),
          items: uniquePaths(section.items || []),
        })),
      };
    } else {
      this.settings = this.createDefaultSettings(language);
      await this.saveData(this.settings);
    }
    this.expandedFolders = new Set(this.settings.expandedFolders || []);
  }

  createDefaultSettings(language = "auto") {
    const root = this.app.vault.getRoot();
    const privateFolders = root.children
      .filter((item) => item instanceof TFolder)
      .filter((folder) => !folder.name.startsWith("_"))
      .map((folder) => folder.path)
      .sort((left, right) => left.localeCompare(right, this.getSortLocale(language), { numeric: true }));

    return {
      language,
      autoOpen: true,
      expandedFolders: [],
      sections: DEFAULT_SECTIONS.map((section) => ({
        id: createId(),
        name: this.translate(this.resolveLanguage(language), section.key),
        icon: section.icon,
        collapsed: false,
        items: section.includeRootFolders ? privateFolders : [],
      })),
    };
  }

  resolveLanguage(mode = this.settings?.language || "auto") {
    if (mode === "zh" || mode === "en") return mode;
    const appLanguage =
      (typeof getLanguage === "function" && getLanguage()) ||
      document.documentElement.lang ||
      navigator.language ||
      "en";
    return String(appLanguage).toLowerCase().startsWith("zh") ? "zh" : "en";
  }

  translate(language, key, variables = {}) {
    const template = TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
    return template.replace(/\{(\w+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(variables, name) ? String(variables[name]) : match
    );
  }

  t(key, variables = {}) {
    return this.translate(this.resolveLanguage(), key, variables);
  }

  getSortLocale(mode = this.settings?.language || "auto") {
    return this.resolveLanguage(mode) === "zh" ? "zh-CN" : "en";
  }

  registerLocalizedCommand(nameKey, command) {
    const localized = { ...command, name: this.t(nameKey) };
    const registered = this.addCommand(localized) || localized;
    this.localizedCommands.push({ command: registered, nameKey });
  }

  refreshLocalizedChrome() {
    const ribbonLabel = this.t("openSidebarNavigation");
    this.ribbonIcon?.setAttribute("aria-label", ribbonLabel);
    for (const entry of this.localizedCommands || []) {
      entry.command.name = this.t(entry.nameKey);
    }
    this.navigationView?.leaf.updateHeader?.();
    this.refreshView();
  }

  async setLanguage(language) {
    if (!LANGUAGE_OPTIONS.has(language)) return;
    this.settings.language = language;
    await this.persist();
    this.refreshLocalizedChrome();
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
        new Notice(this.t("cannotCreateSidebar"));
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
      t: (key, variables) => this.t(key, variables),
      title: this.t("createSectionTitle"),
      label: this.t("sectionName"),
      placeholder: this.t("sectionNamePlaceholder"),
      confirmText: this.t("create"),
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
      t: (key, variables) => this.t(key, variables),
      title: this.t("renameSectionTitle"),
      label: this.t("sectionName"),
      initialValue: section.name,
      confirmText: this.t("rename"),
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
      t: (key, variables) => this.t(key, variables),
      title: this.t("deleteSectionTitle", { name: section.name }),
      description: this.t("deleteSectionDescription"),
      confirmText: this.t("deleteSection"),
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
      t: (key, variables) => this.t(key, variables),
      title: this.t("createFolderInSectionTitle", { name: section.name }),
      description: this.t("createFolderDescription"),
      label: this.t("folderName"),
      placeholder: this.t("folderNamePlaceholder"),
      confirmText: this.t("createFolder"),
      onSubmit: async (name) => {
        if (/[\\/:*?"<>|]/.test(name)) {
          new Notice(this.t("invalidFolderName"));
          return false;
        }
        const path = normalizePath(name);
        if (this.app.vault.getAbstractFileByPath(path)) {
          new Notice(this.t("duplicateRootItem"));
          return false;
        }
        await this.app.vault.createFolder(path);
        await this.addItemToSection(sectionId, path);
        new Notice(this.t("folderCreated", { path }));
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
