import type { AILink } from '../shared/types'
import { clearPendingPrompt, getLinks, getPendingPrompt, getPromptTemplate } from '../shared/storage'

const linksList = document.getElementById('links-list') as HTMLDivElement
const copyContextBtn = document.getElementById('copy-context-btn') as HTMLButtonElement
const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement
const toast = document.getElementById('toast') as HTMLDivElement

let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string) {
  toast.textContent = message
  toast.classList.add('show')
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500)
}

function renderLinks(links: AILink[]) {
  linksList.innerHTML = ''
  for (const link of links) {
    const card = document.createElement('button')
    card.className = 'link-card'
    card.innerHTML = `
      <span class="link-icon">${link.icon}</span>
      <span class="link-info">
        <span class="link-name">${link.name}</span>
        <span class="link-url">${link.url.replace(/^https?:\/\//, '')}</span>
      </span>
      <span class="link-arrow">↗</span>
    `
    card.addEventListener('click', () => {
      chrome.tabs.create({ url: link.url })
    })
    linksList.appendChild(card)
  }
}

async function copyPromptToClipboard(prompt: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(prompt)
    showToast('✓ Context copied to clipboard')
    return true
  } catch {
    showToast('Failed to copy — check clipboard permissions')
    return false
  }
}

async function copyPageContext() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.url) {
    showToast('No active tab URL found')
    return
  }
  const template = await getPromptTemplate()
  const prompt = template.replace('{url}', tab.url)
  await copyPromptToClipboard(prompt)
}

async function handlePendingPrompt() {
  const pendingPrompt = await getPendingPrompt()
  if (!pendingPrompt) return
  const copied = await copyPromptToClipboard(pendingPrompt)
  if (copied) {
    await clearPendingPrompt()
  }
}

async function init() {
  const links = await getLinks()
  renderLinks(links)

  copyContextBtn.addEventListener('click', copyPageContext)

  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })

  // Listen for storage changes to refresh links dynamically
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area === 'local') {
      getLinks().then(renderLinks)
    }
  })

  // Listen for prompt copy requests from service worker
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'COPY_PROMPT' && message.payload) {
      copyPromptToClipboard(message.payload as string).then((copied) => {
        if (copied) {
          clearPendingPrompt()
        }
      })
    }
  })

  await handlePendingPrompt()
}

init()
