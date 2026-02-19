import type { AILink } from './types'
import { DEFAULT_AI_LINKS, DEFAULT_PROMPT_TEMPLATE, STORAGE_KEYS } from './constants'

export async function getLinks(): Promise<AILink[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.AI_LINKS)
  return result[STORAGE_KEYS.AI_LINKS] ?? DEFAULT_AI_LINKS
}

export async function saveLinks(links: AILink[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.AI_LINKS]: links })
}

export async function getPromptTemplate(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PROMPT_TEMPLATE)
  return result[STORAGE_KEYS.PROMPT_TEMPLATE] ?? DEFAULT_PROMPT_TEMPLATE
}

export async function savePromptTemplate(template: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.PROMPT_TEMPLATE]: template })
}
