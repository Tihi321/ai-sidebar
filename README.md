# AI Sidebar — Chrome Extension

A Chrome extension that gives you quick access to AI assistants (ChatGPT, Perplexity, GitHub Copilot, Google Gemini, etc.) from a native Chrome Side Panel. Toggle it open, pick your AI, and inject the current page URL as context with a single click.

## Features

- **Side Panel Hub** — Chrome Side Panel API powers a persistent sidebar with your AI assistant links
- **Per-Link Open Mode** — Each assistant can open as **Embed in side panel** or **Split view popup**
- **Embedded Assistant Viewer** — For compatible sites, assistants can render directly inside the side panel with quick Back / Split / Tab controls
- **Split View Popup** — Opens assistant in a right-side popup while keeping your current page visible on the left
- **Page Context Injection** — "Copy Page Context" button copies a prompt template with the current tab's URL to your clipboard, ready to paste into any AI chat
- **Customizable Prompt Templates** — Edit the default prompt (`"Use this website as context: {url}"`) from the options page; saved locally with `{url}` replaced at copy time
- **Link Management** — Add, remove, reorder, and set open mode per assistant via the options page
- **Toggle & Shortcut** — Click the extension icon or press `Ctrl+Shift+Y` (`Cmd+Shift+Y` on Mac) to toggle the side panel
- **Context Menu** — Right-click any page → "Copy page context prompt" to copy context without opening the panel
- **Dark/Light Theme** — Automatically follows your system preference

## Default AI Assistants

| Icon | Name | URL |
|------|------|-----|
| 🤖 | ChatGPT | https://chatgpt.com |
| 🔍 | Perplexity | https://perplexity.ai |
| ✨ | GitHub Copilot | https://copilot.microsoft.com |
| 💎 | Google Gemini | https://gemini.google.com |

## Tech Stack

- **TypeScript** + **Vite** (with `@crxjs/vite-plugin`)
- **Chrome Manifest V3**
- **Chrome Side Panel API**
- **chrome.storage.local** for persistence (no server, no telemetry)

## Project Structure

```
src/
├── background/service-worker.ts   # Extension lifecycle, toggle, context menu
├── sidepanel/                     # Side panel UI (HTML + CSS + TS)
├── options/                       # Settings page (HTML + CSS + TS)
├── shared/                        # Shared types, constants, storage helpers
└── assets/icons/                  # Extension icons (16, 48, 128)
```

## Development

```bash
npm install
npm run build   # Production build → dist/
npm run dev     # Development build with watch
```

### Load in Chrome

1. Run `npm run build`
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `dist/` folder
5. The AI Sidebar icon appears in your toolbar

### Regenerate Icons

```bash
node scripts/generate-icons.mjs
```

## Usage

1. Click the **AI Sidebar icon** (or press `Ctrl+Shift+Y`) to open the side panel
2. Click an **AI assistant button**:
   - `split` mode opens a right-side popup next to your current page
   - `embed` mode opens the assistant inside the side panel viewer
3. On the page you want to share with the AI, click **"Copy Page Context"** in the side panel
4. The prompt (with the current URL) is now in your clipboard — paste it into the AI chat
5. To customize: click the **⚙️ settings** icon → edit links, choose open mode per link, or change the prompt template

## Commit Convention

Commits follow the format `AIS-<number>: <message>` — see [.agent/skills/git-commits.md](.agent/skills/git-commits.md) for details.

## Agent Docs

- **Plan:** [.agent/plans/PLAN.md](.agent/plans/PLAN.md)
- **Implementation prompt:** [.agent/prompts/implement-full.md](.agent/prompts/implement-full.md)
- **Commit conventions:** [.agent/skills/git-commits.md](.agent/skills/git-commits.md)
