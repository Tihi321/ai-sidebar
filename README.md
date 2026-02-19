# AI Sidebar — Chrome Extension

A Chrome extension that gives you quick access to AI assistants (ChatGPT, Perplexity, GitHub Copilot, Google Gemini, etc.) from a side panel. Toggle it open, pick your AI, and inject the current page URL as context with a single click.

## Features

- **Side Panel Hub** — Chrome Side Panel API powers a persistent sidebar with your AI assistant links
- **One-Click AI Access** — Click any configured link to open the AI service in a new tab
- **Page Context Injection** — "Add Page Context" copies a prompt template with the current tab's URL to your clipboard, ready to paste into any AI chat
- **Customizable Prompt Templates** — Edit the default prompt (`"Use this website as context: {url}"`) to suit your workflow; saved locally
- **Link Management** — Add, remove, and reorder AI assistant links via the options page
- **Toggle & Shortcut** — Extension icon click or `Ctrl+Shift+Y` to toggle the side panel

## Tech Stack

- **TypeScript** + **Vite** (with `@crxjs/vite-plugin`)
- **Chrome Manifest V3**
- **chrome.storage.local** for persistence

## Development

```bash
npm install
npm run dev     # Vite dev build with HMR
npm run build   # Production build
```

Load the extension in Chrome:
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist/` folder

## Commit Convention

Commits follow the format `AIS-<number>: <message>` — see [.agent/skills/git-commits.md](.agent/skills/git-commits.md) for details.