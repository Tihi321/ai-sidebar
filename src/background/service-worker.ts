import { getPromptTemplate, setPendingPrompt } from '../shared/storage'

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'add-page-context',
    title: 'Copy page context prompt',
    contexts: ['page', 'link'],
  })
})

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-sidebar') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return
      chrome.sidePanel.open({ tabId: tab.id }).catch(console.error)
    })
  }
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'add-page-context') return
  const url = tab?.url ?? info.linkUrl
  if (!url) return
  const template = await getPromptTemplate()
  const prompt = template.replace('{url}', url)
  await setPendingPrompt(prompt)
  if (tab?.id) {
    await chrome.sidePanel.open({ tabId: tab.id }).catch(() => undefined)
  }
  chrome.runtime.sendMessage({ type: 'COPY_PROMPT', payload: prompt }).catch(() => {
    // Side panel may not be open yet; pending prompt will be handled on panel init.
  })
})
