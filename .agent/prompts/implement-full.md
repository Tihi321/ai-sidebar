# AI Sidebar — Full Implementation Prompt

Use this prompt to instruct an AI agent to implement the entire AI Sidebar Chrome extension from the plan, committing each step along the way.

---

## Prompt

```
You are implementing a Chrome extension called "AI Sidebar". Read the full plan at `.agent/plans/PLAN.md` and the commit conventions at `.agent/skills/git-commits.md` before starting.

Your job is to implement ALL features described in the plan, working through the todos in order. After completing each todo, make a git commit following the AIS-XX convention and push to origin.

### Workflow Loop

For each todo in the plan:

1. **Read the plan** — re-read `.agent/plans/PLAN.md` to understand the current todo and its requirements
2. **Check git log** — run `git --no-pager log --oneline -5` to find the latest AIS-XX number
3. **Implement** — write the code for this todo. Follow the architecture in the plan exactly (file paths, folder structure, etc.)
4. **Build & verify** — run `npm run build` (or `npm run dev` if first time). Fix any TypeScript or build errors before proceeding
5. **Debug if needed** — if the build fails, read the error output carefully, fix the issue, and rebuild. Repeat until the build succeeds
6. **Commit** — stage all changes, commit with the next AIS-XX number and a descriptive message, include the Co-authored-by trailer
7. **Push** — push to origin
8. **Move to next todo** — repeat from step 1

### Implementation Order

Follow this exact order (respects dependencies):

1. **project-setup** — Initialize the project:
   - Create `package.json` with dependencies: `vite`, `@crxjs/vite-plugin`, `typescript`, `@types/chrome`
   - Run `npm install`
   - Create `tsconfig.json` (strict mode, ES2020 target, DOM lib)
   - Create `vite.config.ts` with `@crxjs/vite-plugin` configured for Manifest V3
   - Create `manifest.json` (Manifest V3) with permissions: `sidePanel`, `activeTab`, `storage`, `clipboardWrite`, `contextMenus`, `commands`
   - Create the full folder structure: `src/background/`, `src/sidepanel/`, `src/content/`, `src/options/`, `src/shared/`, `src/assets/icons/`
   - Verify: `npm run build` should succeed (even if extension does nothing yet)
   - Commit as `AIS-XX: initialize project with vite and typescript`

2. **shared-types** — Create shared modules in `src/shared/`:
   - `types.ts`: Define `AILink` type (`id: string, name: string, url: string, icon: string`), message types for inter-component communication
   - `constants.ts`: Default AI links array (ChatGPT `https://chatgpt.com`, Perplexity `https://perplexity.ai`, GitHub Copilot `https://copilot.microsoft.com`, Google Gemini `https://gemini.google.com`), default prompt template `"Use this website as context: {url}"`, storage keys enum
   - `storage.ts`: Helper functions wrapping `chrome.storage.local` — `getLinks()`, `saveLinks()`, `getPromptTemplate()`, `savePromptTemplate()` with proper TypeScript typing
   - Verify: build succeeds
   - Commit as `AIS-XX: add shared types, constants, and storage helpers`

3. **service-worker** — Build `src/background/service-worker.ts`:
   - Register the side panel using `chrome.sidePanel.setOptions({ path: 'src/sidepanel/sidepanel.html' })`
   - Handle `chrome.action.onClicked` to toggle the side panel open/closed
   - Register keyboard shortcut `Ctrl+Shift+Y` in manifest.json under `commands`
   - Set up context menu item "Add Page Context to Clipboard" using `chrome.contextMenus.create`
   - On context menu click, get the active tab URL, apply the prompt template, and send a message to the side panel
   - Verify: build succeeds
   - Commit as `AIS-XX: implement background service worker`

4. **sidepanel-ui** — Build the side panel in `src/sidepanel/`:
   - `sidepanel.html`: Clean HTML shell that loads sidepanel.ts and sidepanel.css
   - `sidepanel.css`: Modern, clean styling. Dark/light theme support via `prefers-color-scheme`. Compact layout suited for a narrow side panel (~400px wide)
   - `sidepanel.ts`:
     - On load, fetch AI links from storage (fall back to defaults)
     - Render each link as a clickable button/card with icon and name
     - Clicking a link calls `chrome.tabs.create({ url: link.url })` to open in a new tab
     - "Add Page Context" button: gets active tab URL via `chrome.tabs.query`, applies prompt template (replace `{url}`), copies result to clipboard via `navigator.clipboard.writeText()`, shows toast notification
     - Settings gear icon that opens the options page via `chrome.runtime.openOptionsPage()`
     - Listen for storage changes to update the link list dynamically
   - Verify: build succeeds
   - Commit as `AIS-XX: build side panel ui with link switcher`

5. **prompt-templates** — Integrate prompt template system:
   - Side panel loads the saved prompt template from storage on init (falls back to default)
   - "Add Page Context" uses the loaded template, replaces `{url}` with active tab URL
   - This should already be partially done in step 4 — this step ensures template loading/saving is fully wired up
   - Verify: build succeeds
   - Commit as `AIS-XX: add prompt template system for context injection`

6. **options-page** — Build `src/options/`:
   - `options.html`: Options page shell
   - `options.css`: Consistent styling with side panel
   - `options.ts`:
     - **AI Links section**: List all configured links with name, URL, icon fields. Add button to create new link. Delete button per link. Drag-to-reorder or up/down arrow buttons
     - **Prompt Template section**: Textarea pre-filled with current template. Help text explaining `{url}` placeholder. "Save" and "Reset to Default" buttons
     - All changes persist to `chrome.storage.local`
     - On load, populate from storage (fall back to defaults)
   - Register in manifest.json as `options_page`
   - Verify: build succeeds
   - Commit as `AIS-XX: create options page for link management`

7. **icons-assets** — Create extension icons:
   - Generate simple SVG/PNG icons at 16x16, 48x48, 128x128
   - You can create them programmatically (e.g., a simple colored square with "AI" text, or use a canvas-based generator script)
   - Place in `src/assets/icons/` and reference in manifest.json
   - Verify: build succeeds
   - Commit as `AIS-XX: add extension icons`

8. **readme-docs** — Update `README.md`:
   - Ensure it accurately reflects the final implementation
   - Add any missing instructions based on actual file structure
   - Verify: no build needed
   - Commit as `AIS-XX: update readme documentation`

9. **build-test** — Final verification:
   - Run `npm run build` and ensure it produces a clean `dist/` folder
   - Review all files for consistency
   - Fix any remaining issues (commit each fix separately with its own AIS-XX)
   - Final commit if any cleanup was needed

### Important Rules

- **ALWAYS read `.agent/skills/git-commits.md`** before your first commit to get the exact format
- **ALWAYS check `git --no-pager log --oneline -5`** before each commit to get the next AIS number
- **ALWAYS run `npm run build`** after each implementation step. If it fails, debug and fix before committing
- **NEVER skip a build verification step** — catch errors early
- **NEVER bundle unrelated changes** in one commit — keep commits small and logical
- **ALWAYS include the Co-authored-by trailer** in every commit message
- **If a build error occurs**, read the full error output, identify the root cause, fix it, and rebuild. Do not move on until the build is clean
- **Push after every commit** — do not batch pushes
```
