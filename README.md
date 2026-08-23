# Sidebar Navigation

A customizable Obsidian sidebar that organizes real vault files and folders under virtual top-level sections.

## Features

- Create, rename, reorder, collapse, and remove virtual sidebar sections.
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

## Data model

Sections and pinned paths are stored in the plugin's `data.json`. Reordering, moving between sections, expanding, collapsing, or removing a navigation item changes only that configuration. Real files are modified only when you choose an explicit file-management action.

## Development

The plugin is distributed as plain JavaScript and CSS; no build step is required.

```bash
node --check main.js
```
