import type { AILink } from './types'

export const DEFAULT_AI_LINKS: AILink[] = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', icon: '🤖' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://perplexity.ai', icon: '🔍' },
  { id: 'copilot', name: 'GitHub Copilot', url: 'https://copilot.microsoft.com', icon: '✨' },
  { id: 'gemini', name: 'Google Gemini', url: 'https://gemini.google.com', icon: '💎' },
]

export const DEFAULT_PROMPT_TEMPLATE = 'Use this website as context: {url}'

export const STORAGE_KEYS = {
  AI_LINKS: 'ai_links',
  PROMPT_TEMPLATE: 'prompt_template',
} as const
