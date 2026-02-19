# Git Commit Conventions

## Commit Message Format

```
AIS-<number>: <commit message>
```

- **Prefix:** `AIS-` followed by an incrementing number (zero-padded two digits)
- **Separator:** `: ` (colon + space)
- **Message:** Short, descriptive commit message in lowercase (imperative mood preferred)

## Examples

```
AIS-01: initialize project with vite and typescript
AIS-02: add shared types and storage helpers
AIS-03: implement background service worker
AIS-04: build side panel ui with link switcher
AIS-05: add prompt template system for context injection
AIS-06: create options page for link management
AIS-07: fix toggle behavior on extension icon click
```

## Rules

1. **Small/medium logical commits** — each commit should represent one logical change (a feature, a fix, a refactor). Do not bundle unrelated changes.
2. **Increment sequentially** — check the latest commit number before committing and use the next number.
3. **Keep messages concise** — aim for under 72 characters after the prefix.
4. **Always include the Co-authored-by trailer** when commits are made by an AI agent:
   ```
   Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
   ```

## How to Find the Next Number

Before committing, run:
```bash
git --no-pager log --oneline | head -5
```
Look at the latest `AIS-XX` number and increment by 1.
