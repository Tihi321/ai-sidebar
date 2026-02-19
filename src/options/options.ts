import type { AILink, AILinkOpenMode } from '../shared/types'
import { getLinks, saveLinks, getPromptTemplate, savePromptTemplate } from '../shared/storage'
import { DEFAULT_PROMPT_TEMPLATE } from '../shared/constants'

const templateInput = document.getElementById('template-input') as HTMLTextAreaElement
const saveTemplateBtn = document.getElementById('save-template-btn') as HTMLButtonElement
const resetTemplateBtn = document.getElementById('reset-template-btn') as HTMLButtonElement
const linksList = document.getElementById('links-list') as HTMLDivElement
const newIconInput = document.getElementById('new-icon') as HTMLInputElement
const newNameInput = document.getElementById('new-name') as HTMLInputElement
const newOpenModeInput = document.getElementById('new-open-mode') as HTMLSelectElement
const newUrlInput = document.getElementById('new-url') as HTMLInputElement
const addLinkBtn = document.getElementById('add-link-btn') as HTMLButtonElement
const toast = document.getElementById('toast') as HTMLDivElement

let links: AILink[] = []
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string) {
  toast.textContent = message
  toast.classList.add('show')
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500)
}

function renderLinks() {
  linksList.innerHTML = ''
  links.forEach((link, index) => {
    const item = document.createElement('div')
    item.className = 'link-item'
    item.innerHTML = `
      <span class="link-item-icon">${link.icon}</span>
      <span class="link-item-info">
        <span class="link-item-name">${link.name}</span>
        <span class="link-item-url">${link.url}</span>
      </span>
      <span class="link-item-actions">
        <select class="mode-select" data-action="mode" data-index="${index}" title="Open mode">
          <option value="split" ${link.openMode === 'split' ? 'selected' : ''}>Split</option>
          <option value="embed" ${link.openMode === 'embed' ? 'selected' : ''}>Embed</option>
        </select>
        <button class="order-btn" data-action="up" data-index="${index}" ${index === 0 ? 'disabled' : ''} title="Move up">↑</button>
        <button class="order-btn" data-action="down" data-index="${index}" ${index === links.length - 1 ? 'disabled' : ''} title="Move down">↓</button>
        <button class="btn btn-danger" data-action="delete" data-index="${index}" title="Remove">✕</button>
      </span>
    `
    linksList.appendChild(item)
  })

  linksList.querySelectorAll('button[data-action]').forEach(control => {
    control.addEventListener('click', async (e) => {
      const el = e.currentTarget as HTMLElement
      const action = el.dataset.action
      const index = parseInt(el.dataset.index ?? '0', 10)

      if (action === 'delete') {
        links = links.filter((_, i) => i !== index)
      } else if (action === 'up' && index > 0) {
        [links[index - 1], links[index]] = [links[index], links[index - 1]]
      } else if (action === 'down' && index < links.length - 1) {
        [links[index], links[index + 1]] = [links[index + 1], links[index]]
      }

      await saveLinks(links)
      renderLinks()
    })
  })

  linksList.querySelectorAll('select[data-action="mode"]').forEach(control => {
    control.addEventListener('change', async (e) => {
      const el = e.currentTarget as HTMLSelectElement
      const index = parseInt(el.dataset.index ?? '0', 10)
      links[index].openMode = el.value as AILinkOpenMode
      await saveLinks(links)
      renderLinks()
    })
  })
}

async function init() {
  links = await getLinks()
  renderLinks()

  const template = await getPromptTemplate()
  templateInput.value = template

  saveTemplateBtn.addEventListener('click', async () => {
    const val = templateInput.value.trim()
    if (!val) { showToast('Template cannot be empty'); return }
    await savePromptTemplate(val)
    showToast('✓ Template saved')
  })

  resetTemplateBtn.addEventListener('click', async () => {
    templateInput.value = DEFAULT_PROMPT_TEMPLATE
    await savePromptTemplate(DEFAULT_PROMPT_TEMPLATE)
    showToast('✓ Template reset to default')
  })

  addLinkBtn.addEventListener('click', async () => {
    const icon = newIconInput.value.trim() || '🔗'
    const name = newNameInput.value.trim()
    const openMode = newOpenModeInput.value as AILinkOpenMode
    const url = newUrlInput.value.trim()

    if (!name || !url) { showToast('Name and URL are required'); return }
    if (!url.startsWith('http')) { showToast('URL must start with http:// or https://'); return }

    const newLink: AILink = {
      id: `link-${Date.now()}`,
      name,
      url,
      icon,
      openMode,
    }
    links.push(newLink)
    await saveLinks(links)
    renderLinks()

    newIconInput.value = ''
    newNameInput.value = ''
    newOpenModeInput.value = 'split'
    newUrlInput.value = ''
    showToast(`✓ "${name}" added`)
  })
}

init()
