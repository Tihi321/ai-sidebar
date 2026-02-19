# AI Sidebar — Chrome Extension Implementation Plan

## Problem
Build a Chrome extension that provides quick access to AI assistants (ChatGPT, Perplexity, Copilot, Gemini, etc.) via Chrome's **Side Panel API**. Users can toggle the sidebar, pick an AI service, and inject page context (full page text or selected text) into the AI chat.

## Approach
- **Chrome Side Panel API** for the sidebar (avoids iframe/X-Frame-Options issues)
- **TypeScript** with **Vite** + `@crxjs/vite-plugin` for fast builds and HMR during development
- **chrome.storage.local** for persisting user-configured AI links
- **URL-based context** with customizable prompt templates (no content script needed)
- **Manifest V3**

## Architecture

```
ai-sidebar/
├── src/
│   ├── background/
│   │   └── service-worker.ts      # Extension lifecycle, sidePanel registration, context menu
│   ├── sidepanel/
│   │   ├── sidepanel.html          # Side panel UI shell
│   │   ├── sidepanel.ts            # Side panel logic (link list, navigation, context injection)
│   │   └── sidepanel.css           # Styles
│   ├── content/                      # (reserved for future use)
│   ├── options/
│   │   ├── options.html            # Options page for managing AI links
│   │   ├── options.ts
│   │   └── options.css
│   ├── shared/
│   │   ├── types.ts                # Shared TypeScript types (AILink, PromptTemplate)
│   │   ├── constants.ts            # Default AI links, default prompt template, storage keys
│   │   └── storage.ts              # chrome.storage.local helpers
│   └── assets/
│       └── icons/                  # Extension icons (16, 48, 128)
├── manifest.json                   # Manifest V3
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Key Features

### 1. Side Panel with AI Link Switcher
- Side panel shows a list of configured AI assistant links (buttons/tabs)
- Since Side Panel only loads local extension pages (not arbitrary URLs), the panel acts as a **launcher/hub**
- Clicking an AI link opens it in a new tab via `chrome.tabs.create`
- The side panel is the control surface for context extraction and link management
- **Best hybrid:** The side panel acts as a hub; clicking a link opens the AI site in a new tab, and a "Send Context" button copies/prepares context for pasting

### 2. Toggle Behavior
- Extension icon click toggles the side panel open/closed
- Keyboard shortcut (configurable, default: `Ctrl+Shift+Y`)

### 3. Context Injection (URL-based with Prompt Templates)
- **Simplified approach:** No page text extraction — just grab the current tab's URL via `chrome.tabs.query`
- Side panel has an "Add Page Context" button that copies a **prompt template** with the URL to the clipboard
- **Default prompt template:** `"Use this website as context: {url}"`
- The `{url}` placeholder is replaced with the active tab's URL at copy time
- **Customizable:** Users can edit the prompt template in the options page; saved to `chrome.storage.local`
- Toast notification confirms the prompt was copied to clipboard
- No content script needed for context extraction (simplifies architecture)

### 4. Link Management (Options Page)
- Add / remove / reorder AI assistant links
- Each link has: name, URL, optional icon/emoji
- Stored in `chrome.storage.local`
- Default links: ChatGPT, Perplexity, GitHub Copilot, Google Gemini

## Todos

1. **project-setup** — Initialize project: `package.json`, Vite config, TypeScript config, Manifest V3, folder structure
2. **shared-types** — Create shared types, constants (default AI links), and storage helpers
3. **service-worker** — Build background service worker: register side panel, handle extension icon click toggle, keyboard shortcut, context menu
4. **sidepanel-ui** — Build side panel HTML/CSS/TS: AI link list, navigation buttons, "Add Page Context" button (copies prompt template with current URL to clipboard), toast notification
5. **prompt-templates** — Build prompt template system: default template "Use this website as context: {url}", store/load custom template from chrome.storage.local, replace {url} placeholder at copy time
6. **options-page** — Build options page: add/remove/reorder AI links, edit prompt template (textarea with {url} placeholder), persist all to chrome.storage.local
7. **icons-assets** — Create/add extension icons (16, 48, 128) and any visual assets
8. **readme-docs** — Update README with installation, usage, and development instructions
9. **build-test** — Build the extension, load unpacked in Chrome, and verify all features work end-to-end

## Notes & Considerations
- **iframe limitations:** Many AI sites set `X-Frame-Options: DENY`. The side panel will function as a **launcher hub** — clicking a link opens the AI site in a new tab. Context is copied to clipboard for easy pasting.
- **Future enhancement:** If specific AI sites allow iframe embedding, we can add an inline mode per-link.
- **Future enhancement:** Explore injecting context directly into AI site input fields via a content script running on those pages (fragile but possible).
- **Manifest V3 permissions needed:** `sidePanel`, `activeTab`, `storage`, `clipboardWrite`, `contextMenus`, `commands`
- **No content script needed** — context is just the URL from `chrome.tabs.query`, keeping the extension simple and permission-light
