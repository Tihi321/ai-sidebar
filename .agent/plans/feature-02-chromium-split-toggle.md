# Feature 02 — Chromium Split-View Style Replace + Close (Same Window)

## Problem
Current `split` mode opens assistants in a separate popup window.  
Requested behavior: split mode should open assistant in the **same browser window** (right-side adjacent tab flow), replacing the previous assistant tab when another assistant is clicked. Closing split assistant should be a **separate button/action**, not link-toggle.

## Constraint (Confirmed)
Chrome extension APIs do **not** currently expose a reliable method to programmatically activate native Chromium "Split View" layout.

## Approved Direction
Use a navigate-active-tab strategy that is compatible with native split-view usage:
- Assume user has already set up browser split view (right-click tab → "New split view")
- Clicking an assistant navigates the **active tab** to the assistant URL (first time)
- Clicking another assistant replaces the tracked assistant tab URL
- Separate close action closes the tracked split assistant tab
- One-time toast hint shown to remind user about split view setup

## Scope
1. Replace tab-creation split behavior with active-tab navigation.
2. Add replace behavior per window for split links:
   - If no tracked assistant tab exists → navigate active tab to assistant URL and track it
   - If tracked assistant tab exists → update its URL (prefer tab URL update; fallback recreate)
   - No close-on-link-click behavior
3. Add explicit close action:
   - `Close Assistant Split View` button closes tracked assistant split tab for current window
4. Keep embed mode unchanged for iframe-compatible assistants.
5. Keep URL-context copy flow unchanged.

## Architecture Changes

### Shared Types / Storage
- Add lightweight split session tracking model:
  - `windowId`
  - `assistantTabId`
  - `assistantLinkId`
- Persist in `chrome.storage.session` (preferred) with fallback to `chrome.storage.local` if needed.

### Side Panel Launch Logic
- For `openMode = split`:
  1. Get active tab + window
  2. Check tracked assistant session for that window
  3. If tracked assistant tab exists and is valid → update it to selected link URL and activate
  4. Else navigate the active tab to assistant URL, track it as assistant tab
  5. Keep `assistantLinkId` synced to selected link
  6. Show one-time toast hint about setting up browser split view
- Add explicit close handler:
  - Close tracked assistant tab for current window, then clear session
- Add cleanup listeners:
  - On tab close / window close, clear stale tracked session.

### UI Updates
- Link card state hints:
  - show `split`/`embed` badge (already present)
  - show `open` indicator on active split link in current window
- Add dedicated close control:
  - "Close Assistant Split View" button in side panel (enabled only when split assistant exists)

## TODOs
1. **feature02-split-session-model**  
   Add split session types/helpers and storage key(s) for per-window assistant tab tracking.

2. **feature02-split-toggle-logic**  
   Replace popup split helper with same-window adjacent-tab **open/replace** logic (no toggle-close on link click).

3. **feature02-split-state-cleanup**  
   Add listeners for tab/window removal to clear stale split session state.

4. **feature02-sidebar-state-ui**  
   Reflect active split link state in sidebar and add separate "Close Assistant Split View" control.

5. **feature02-readme-update**  
   Update docs to explain same-window split toggle behavior and native split-view manual step.

6. **feature02-qa**  
   Validate:
   - first split click opens adjacent tab
   - clicking another split link replaces tracked assistant tab
   - close button closes tracked assistant tab
   - stale state clears after manual tab close
   - embed mode still works

## Notes
- This plan intentionally removes dependency on popup windows for split mode.
- No API assumptions about native split-view automation are made.
