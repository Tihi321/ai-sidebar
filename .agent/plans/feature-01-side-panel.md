# Feature 01 — Side Panel / Split View Assistants

## Problem
Current behavior opens assistant links in a new tab only.  
Goal: assistants should open next to the current page: in **side panel embed mode** when configured, or in **split view popup mode** so the main site remains visible.

## Confirmed Decisions
- Split-view fallback target: **separate popup window docked on the right**
- Configuration scope: **per-link behavior**
- Detection approach: **explicit per-link mode** (no unreliable auto-detect)

## Proposed Approach
1. Extend link model with `openMode`:
   - `embed` = open inside extension side panel (iframe-based viewer)
   - `split` = open assistant in right-side popup window
2. Keep current side panel home as launcher, add an embedded assistant view in the panel:
   - Home: link list + context actions
   - Viewer: iframe + back button + open-in-tab button
3. For split mode, create a right popup and keep current page visible:
   - Read current window bounds
   - Resize current window to left section
   - Open assistant popup on right section using `chrome.windows.create`
4. Add per-link mode controls in Options:
   - Dropdown per link: `Embed in side panel` or `Split view popup`
5. Defaults/migration:
   - Existing saved links without `openMode` default to `split` (safe behavior)
6. Keep URL-context copy feature unchanged.

## Technical Notes
- Some assistants block embedding (`X-Frame-Options` / `frame-ancestors`).  
  With explicit per-link mode, user chooses `split` for blocked sites.
- Split mode requires `"windows"` permission.
- Embed mode remains best-effort; if a site blocks iframe, panel should show a clear message and a one-click “Open in split view”.

## TODOs
1. **feature01-model-update**  
   Add `openMode` to shared `AILink` type, constants defaults, and storage migration logic.

2. **feature01-panel-viewer**  
   Implement side panel embedded viewer state (home/viewer), iframe container, and fallback message UI.

3. **feature01-launch-behavior**  
   Update link click handler to branch by `openMode`:
   - `embed` -> open viewer in side panel
   - `split` -> execute split popup flow

4. **feature01-split-window**  
   Add split window helper using `chrome.windows.getCurrent`, `chrome.windows.update`, `chrome.windows.create`; preserve reasonable minimum widths.

5. **feature01-options-mode**  
   Add per-link mode selector to options page and persist value.

6. **feature01-manifest-update**  
   Add `"windows"` permission and validate side panel + popup behavior.

7. **feature01-qa-docs**  
   Test embed and split scenarios, blocked-iframe scenario, and update README usage/settings docs.

## Dependency Order
- `feature01-model-update` → `feature01-panel-viewer`
- `feature01-model-update` → `feature01-split-window`
- `feature01-panel-viewer` + `feature01-split-window` → `feature01-launch-behavior`
- `feature01-model-update` → `feature01-options-mode`
- `feature01-launch-behavior` + `feature01-options-mode` + `feature01-manifest-update` → `feature01-qa-docs`
