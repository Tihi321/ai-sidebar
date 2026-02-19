export type AILinkOpenMode = 'embed' | 'split'

export interface AILink {
  id: string
  name: string
  url: string
  icon: string
  openMode: AILinkOpenMode
}

export interface PromptTemplate {
  template: string
}

export type MessageType = 'GET_CONTEXT' | 'CONTEXT_RESULT'

export interface Message {
  type: MessageType
  payload?: string
}
