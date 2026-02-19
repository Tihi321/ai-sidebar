import type { AILink } from './types'

export const DEFAULT_AI_LINKS: AILink[] = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com', icon: '🤖', openMode: 'split' },
  { id: 'perplexity', name: 'Perplexity', url: 'https://perplexity.ai', icon: '🔍', openMode: 'split' },
  { id: 'copilot', name: 'GitHub Copilot', url: 'https://copilot.microsoft.com', icon: '✨', openMode: 'split' },
  { id: 'gemini', name: 'Google Gemini', url: 'https://gemini.google.com', icon: '💎', openMode: 'split' },
]

export const DEFAULT_PROMPT_TEMPLATE = 'Use this website as context: {url}'

export const STORAGE_KEYS = {
  AI_LINKS: 'ai_links',
  PROMPT_TEMPLATE: 'prompt_template',
  PENDING_PROMPT: 'pending_prompt',
} as const
