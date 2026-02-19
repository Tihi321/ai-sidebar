import type { AILink, SplitSession } from '../shared/types'
import {
  clearPendingPrompt,
  clearSplitSession,
  clearSplitSessionByTabId,
  getLinks,
  getPendingPrompt,
  getPromptTemplate,
  getSplitSession,
  setSplitSession,
} from '../shared/storage'

const linksList = document.getElementById('links-list') as HTMLDivElement
const copyContextBtn = document.getElementById('copy-context-btn') as HTMLButtonElement
const setSplitTargetBtn = document.getElementById('set-split-target-btn') as HTMLButtonElement
const closeSplitBtn = document.getElementById('close-split-btn') as HTMLButtonElement
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
let linksCache: AILink[] = []
let activeWindowId: number | null = null
let activeSplitSession: SplitSession | null = null
const MANUAL_SPLIT_LINK_ID = '__manual_split_target__'

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

function updateSplitButtonState() {
  closeSplitBtn.disabled = !activeSplitSession
}

async function refreshActiveSplitState() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  activeWindowId = activeTab?.windowId ?? null
  if (!activeWindowId) {
    activeSplitSession = null
    updateSplitButtonState()
    return
  }

  const session = await getSplitSession(activeWindowId)
  if (!session) {
    activeSplitSession = null
    updateSplitButtonState()
    return
  }

  try {
    await chrome.tabs.get(session.assistantTabId)
    activeSplitSession = session
  } catch {
    await clearSplitSession(activeWindowId)
    activeSplitSession = null
  }
  updateSplitButtonState()
}

function modeLabel(mode: AILink['openMode']): string {
  return mode === 'embed' ? 'embed' : 'split'
}

function renderLinks(links: AILink[]) {
  linksList.innerHTML = ''
  for (const link of links) {
    const isOpenSplit =
      link.openMode === 'split' && activeSplitSession?.assistantLinkId === link.id
    const card = document.createElement('button')
    card.className = `link-card${isOpenSplit ? ' is-open' : ''}`
    card.innerHTML = `
      <span class="link-icon">${link.icon}</span>
      <span class="link-info">
        <span class="link-name">${link.name}</span>
        <span class="link-url">${link.url.replace(/^https?:\/\//, '')}</span>
      </span>
      <span class="link-mode">${modeLabel(link.openMode)}</span>
      ${isOpenSplit ? '<span class="link-open-indicator">open</span>' : ''}
      <span class="link-arrow">↗</span>
    `
    card.addEventListener('click', async () => {
      if (link.openMode === 'embed') {
        showViewer(link)
        return
      }
      await openOrReplaceSplitTab(link)
    })
    linksList.appendChild(card)
  }
}

async function openOrReplaceSplitTab(link: AILink) {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!activeTab?.windowId) {
    showToast('No active window found')
    return
  }

  const windowId = activeTab.windowId
  const existingSession = await getSplitSession(windowId)

  if (existingSession) {
    try {
      await chrome.tabs.update(existingSession.assistantTabId, { url: link.url, active: true })
      await setSplitSession({
        windowId,
        assistantTabId: existingSession.assistantTabId,
        assistantLinkId: link.id,
      })
      await refreshActiveSplitState()
      renderLinks(linksCache)
      return
    } catch {
      await clearSplitSession(windowId)
    }
  }

  showToast('Set an assistant tab first: Use Current Tab as Assistant')
}

async function setCurrentTabAsSplitAssistant() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!activeTab?.windowId || !activeTab.id) {
    showToast('No active tab found')
    return
  }

  await setSplitSession({
    windowId: activeTab.windowId,
    assistantTabId: activeTab.id,
    assistantLinkId: activeSplitSession?.assistantLinkId ?? MANUAL_SPLIT_LINK_ID,
  })
  await refreshActiveSplitState()
  renderLinks(linksCache)
  showToast('Assistant tab selected')
}

async function closeSplitAssistantTab() {
  await refreshActiveSplitState()
  if (!activeSplitSession || !activeWindowId) {
    showToast('No split assistant tab to close')
    return
  }

  try {
    await chrome.tabs.remove(activeSplitSession.assistantTabId)
  } catch {
    // ignore if already closed
  }
  await clearSplitSession(activeWindowId)
  await refreshActiveSplitState()
  renderLinks(linksCache)
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

function setupSplitStateListeners() {
  chrome.tabs.onRemoved.addListener((tabId) => {
    clearSplitSessionByTabId(tabId).then(async () => {
      await refreshActiveSplitState()
      renderLinks(linksCache)
    })
  })

  chrome.windows.onRemoved.addListener((windowId) => {
    clearSplitSession(windowId).then(async () => {
      await refreshActiveSplitState()
      renderLinks(linksCache)
    })
  })

  chrome.tabs.onActivated.addListener(() => {
    refreshActiveSplitState().then(() => renderLinks(linksCache))
  })

  chrome.windows.onFocusChanged.addListener(() => {
    refreshActiveSplitState().then(() => renderLinks(linksCache))
  })
}

async function init() {
  linksCache = await getLinks()
  await refreshActiveSplitState()
  renderLinks(linksCache)
  showHomeView()

  copyContextBtn.addEventListener('click', copyPageContext)
  setSplitTargetBtn.addEventListener('click', () => {
    setCurrentTabAsSplitAssistant().catch(() => undefined)
  })
  closeSplitBtn.addEventListener('click', () => {
    closeSplitAssistantTab().catch(() => undefined)
  })
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
    await openOrReplaceSplitTab(currentViewerLink)
  })

  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area === 'local') {
      getLinks().then(async (links) => {
        linksCache = links
        await refreshActiveSplitState()
        renderLinks(linksCache)
      })
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

  setupSplitStateListeners()
  await handlePendingPrompt()
}

init()
