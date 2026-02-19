import type { AILink, AILinkOpenMode } from './types'
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
