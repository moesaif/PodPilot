import { create } from 'zustand'
import type { AIMessage, AIContext } from '@shared/types'

interface AIStore {
  messages: AIMessage[]
  streaming: boolean
  streamingContent: string
  context: AIContext
  addMessage: (msg: AIMessage) => void
  setStreaming: (v: boolean) => void
  appendStreamingContent: (delta: string) => void
  finalizeStream: () => void
  clearMessages: () => void
  setContext: (ctx: AIContext) => void
}

export const useAIStore = create<AIStore>((set, get) => ({
  messages: [],
  streaming: false,
  streamingContent: '',
  context: {},
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setStreaming: (streaming) => set({ streaming, streamingContent: streaming ? '' : get().streamingContent }),
  appendStreamingContent: (delta) => set((s) => ({ streamingContent: s.streamingContent + delta })),
  finalizeStream: () => {
    const { streamingContent, messages } = get()
    if (streamingContent) {
      set({
        messages: [...messages, { role: 'assistant', content: streamingContent, timestamp: Date.now() }],
        streaming: false,
        streamingContent: ''
      })
    }
  },
  clearMessages: () => set({ messages: [], streamingContent: '', streaming: false }),
  setContext: (ctx) => set({ context: ctx })
}))
