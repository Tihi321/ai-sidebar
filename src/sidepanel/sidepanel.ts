import type { AILink } from '../shared/types'
import { clearPendingPrompt, getLinks, getPendingPrompt, getPromptTemplate } from '../shared/storage'

const linksList = document.getElementById('links-list') as HTMLDivElement
const copyContextBtn = document.getElementById('copy-context-btn') as HTMLButtonElement
const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement
const toast = document.getElementById('toast') as HTMLDivElement
const homeView = document.getElementById('home-view') as HTMLElement
const viewerView = document.getElementById('viewer-view') as HTMLElement
const viewerTitle = document.getElementById('viewer-title') as HTMLSpanElement
const assistantFrame = document.getElementById('assistant-frame') as HTMLIFrameElement
const backBtn = document.getElementById('back-btn') as HTMLButtonElement
const openSplitBtn = document.getElementById('open-split-btn') as HTMLButtonElement
const openTabBtn = document.getElementById('open-tab-btn') as HTMLButtonElement

let toastTimer: ReturnType<typeof setTimeout> | null = null
let currentViewerLink: AILink | null = null

function showToast(message: string) {
  toast.textContent = message
  toast.classList.add('show')
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500)
}

function showHomeView() {
  homeView.classList.remove('hidden')
  viewerView.classList.add('hidden')
  assistantFrame.src = 'about:blank'
  currentViewerLink = null
}

function showViewer(link: AILink) {
  currentViewerLink = link
  viewerTitle.textContent = link.name
  assistantFrame.src = link.url
  homeView.classList.add('hidden')
  viewerView.classList.remove('hidden')
}

async function openInSplitView(url: string) {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!activeTab?.windowId) {
    await chrome.windows.create({ url, type: 'popup', focused: true })
    return
  }

  const currentWindow = await chrome.windows.get(activeTab.windowId)
  const { id, left, top, width, height } = currentWindow
  if (!id || width === undefined || height === undefined) {
    await chrome.windows.create({ url, type: 'popup', focused: true })
    return
  }

  const windowLeft = left ?? 0
  const windowTop = top ?? 0
  const minMainWidth = 520
  const minPopupWidth = 380
  const maxPopupWidth = 760
  let popupWidth = Math.round(width * 0.38)
  popupWidth = Math.max(minPopupWidth, Math.min(maxPopupWidth, popupWidth))
  let mainWidth = width - popupWidth

  if (mainWidth < minMainWidth) {
    mainWidth = minMainWidth
    popupWidth = width - minMainWidth
  }

  if (popupWidth < minPopupWidth) {
    await chrome.windows.create({ url, type: 'popup', focused: true })
    return
  }

  try {
    await chrome.windows.update(id, {
      state: 'normal',
      left: windowLeft,
      top: windowTop,
      width: mainWidth,
      height,
      focused: true,
    })
    await chrome.windows.create({
      url,
      type: 'popup',
      left: windowLeft + mainWidth,
      top: windowTop,
      width: popupWidth,
      height,
      focused: true,
    })
  } catch {
    await chrome.windows.create({ url, type: 'popup', focused: true })
  }
}

function modeLabel(mode: AILink['openMode']): string {
  return mode === 'embed' ? 'embed' : 'split'
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
      <span class="link-mode">${modeLabel(link.openMode)}</span>
      <span class="link-arrow">↗</span>
    `
    card.addEventListener('click', async () => {
      if (link.openMode === 'embed') {
        showViewer(link)
        return
      }
      await openInSplitView(link.url)
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
  showHomeView()

  copyContextBtn.addEventListener('click', copyPageContext)
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })
  backBtn.addEventListener('click', showHomeView)
  openTabBtn.addEventListener('click', () => {
    if (!currentViewerLink) return
    chrome.tabs.create({ url: currentViewerLink.url })
  })
  openSplitBtn.addEventListener('click', async () => {
    if (!currentViewerLink) return
    await openInSplitView(currentViewerLink.url)
  })

  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area === 'local') {
      getLinks().then(renderLinks)
    }
  })

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
