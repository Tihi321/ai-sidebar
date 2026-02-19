import type { AILink, AILinkOpenMode, SplitSession } from './types'
import { DEFAULT_AI_LINKS, DEFAULT_PROMPT_TEMPLATE, STORAGE_KEYS } from './constants'

function normalizeOpenMode(mode: unknown): AILinkOpenMode {
  return mode === 'embed' ? 'embed' : 'split'
}

function normalizeLink(raw: unknown, index: number): AILink | null {
  if (typeof raw !== 'object' || raw === null) return null
  const record = raw as Record<string, unknown>
  const id = typeof record.id === 'string' && record.id.trim() ? record.id : `link-${index}`
  const name = typeof record.name === 'string' ? record.name.trim() : ''
  const url = typeof record.url === 'string' ? record.url.trim() : ''
  const icon = typeof record.icon === 'string' && record.icon.trim() ? record.icon : '🔗'
  if (!name || !url) return null
  return {
    id,
    name,
    url,
    icon,
    openMode: normalizeOpenMode(record.openMode),
  }
}

function hasOpenMode(link: unknown): boolean {
  return typeof link === 'object' && link !== null && 'openMode' in link
}

function getSplitStorageArea(): chrome.storage.StorageArea {
  return chrome.storage.session ?? chrome.storage.local
}

function normalizeSplitSession(raw: unknown): SplitSession | null {
  if (typeof raw !== 'object' || raw === null) return null
  const record = raw as Record<string, unknown>
  if (
    typeof record.windowId !== 'number' ||
    typeof record.assistantTabId !== 'number' ||
    typeof record.assistantLinkId !== 'string' ||
    !record.assistantLinkId
  ) {
    return null
  }
  return {
    windowId: record.windowId,
    assistantTabId: record.assistantTabId,
    assistantLinkId: record.assistantLinkId,
  }
}

export async function getLinks(): Promise<AILink[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.AI_LINKS)
  const rawLinks = result[STORAGE_KEYS.AI_LINKS]
  if (!Array.isArray(rawLinks)) {
    return DEFAULT_AI_LINKS
  }

  const normalized = rawLinks
    .map((item, index) => normalizeLink(item, index))
    .filter((item): item is AILink => item !== null)

  if (normalized.length === 0) {
    return DEFAULT_AI_LINKS
  }

  const needsMigration =
    normalized.length !== rawLinks.length || rawLinks.some((item) => !hasOpenMode(item))

  if (needsMigration) {
    await saveLinks(normalized)
  }

  return normalized
}

export async function saveLinks(links: AILink[]): Promise<void> {
  const normalized = links.map((link, index) => ({
    id: link.id || `link-${index}`,
    name: link.name.trim(),
    url: link.url.trim(),
    icon: link.icon.trim() || '🔗',
    openMode: normalizeOpenMode(link.openMode),
  }))
  await chrome.storage.local.set({ [STORAGE_KEYS.AI_LINKS]: normalized })
}

export async function getPromptTemplate(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PROMPT_TEMPLATE)
  return result[STORAGE_KEYS.PROMPT_TEMPLATE] ?? DEFAULT_PROMPT_TEMPLATE
}

export async function savePromptTemplate(template: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.PROMPT_TEMPLATE]: template })
}

export async function getPendingPrompt(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PENDING_PROMPT)
  return result[STORAGE_KEYS.PENDING_PROMPT] ?? null
}

export async function setPendingPrompt(prompt: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.PENDING_PROMPT]: prompt })
}

export async function clearPendingPrompt(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.PENDING_PROMPT)
}

async function getSplitSessionMap(): Promise<Record<string, SplitSession>> {
  const storage = getSplitStorageArea()
  const result = await storage.get(STORAGE_KEYS.SPLIT_SESSIONS)
  const rawMap = result[STORAGE_KEYS.SPLIT_SESSIONS]
  if (typeof rawMap !== 'object' || rawMap === null) return {}

  const normalized: Record<string, SplitSession> = {}
  for (const [key, value] of Object.entries(rawMap as Record<string, unknown>)) {
    const session = normalizeSplitSession(value)
    if (session) normalized[key] = session
  }
  return normalized
}

async function saveSplitSessionMap(map: Record<string, SplitSession>): Promise<void> {
  const storage = getSplitStorageArea()
  await storage.set({ [STORAGE_KEYS.SPLIT_SESSIONS]: map })
}

export async function getSplitSession(windowId: number): Promise<SplitSession | null> {
  const map = await getSplitSessionMap()
  return map[String(windowId)] ?? null
}

export async function setSplitSession(session: SplitSession): Promise<void> {
  const map = await getSplitSessionMap()
  map[String(session.windowId)] = session
  await saveSplitSessionMap(map)
}

export async function clearSplitSession(windowId: number): Promise<void> {
  const map = await getSplitSessionMap()
  delete map[String(windowId)]
  await saveSplitSessionMap(map)
}

export async function clearSplitSessionByTabId(tabId: number): Promise<void> {
  const map = await getSplitSessionMap()
  for (const [key, value] of Object.entries(map)) {
    if (value.assistantTabId === tabId) {
      delete map[key]
    }
  }
  await saveSplitSessionMap(map)
}
