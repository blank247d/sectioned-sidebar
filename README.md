# Sidebar Navigation

A customizable Obsidian sidebar that organizes real vault files and folders under virtual top-level sections.

![Sidebar Navigation overview](assets/sidebar-navigation-overview.png)

## Interaction demo

![Expand a folder in Sidebar Navigation](assets/sidebar-navigation-demo.gif)

Captured from the real Obsidian interface in an isolated demo vault containing only fictional sections, folders, and notes. No personal vault content is shown.

## Features

- Create, rename, reorder, collapse, and remove virtual sidebar sections.
- Follow Obsidian's interface language or switch the plugin manually between Simplified Chinese and English.
- Pin existing notes and folders without changing their real vault paths.
- Expand ordinary folders and browse their descendants in place.
- Reuse Obsidian's file-menu extension system for familiar file and folder actions.
- Keep navigation-specific actions in a separate **Navigation management** submenu.
- Follow Obsidian rename events so pinned paths remain valid.
- Preserve missing references until you explicitly remove them.

## Install

1. Copy this repository into your vault as `.obsidian/plugins/notion-navigation/`.
2. In Obsidian, open **Settings → Community plugins**.
3. Enable **Sidebar Navigation**.

The internal plugin ID remains `notion-navigation` for compatibility with existing installations and saved settings. The displayed plugin name is **Sidebar Navigation**.

Under **Settings → Sidebar Navigation → Language**, choose **Follow Obsidian**, **简体中文**, or **English**. Changing the interface language does not rename existing custom sections.

## Data model

Sections and pinned paths are stored in the plugin's `data.json`. Reordering, moving between sections, expanding, collapsing, or removing a navigation item changes only that configuration. Real files are modified only when you choose an explicit file-management action.

## Development

The plugin is distributed as plain JavaScript and CSS; no build step is required.

```bash
node --check main.js
```
