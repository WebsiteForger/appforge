import { create } from 'zustand';

export interface ToolCallInfo {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  isError?: boolean;
  isRunning?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolCallInfo[];
  isStreaming?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;

  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  appendToMessage: (id: string, text: string) => void;
  addToolCallToMessage: (messageId: string, toolCall: ToolCallInfo) => void;
  updateToolCall: (messageId: string, toolCallId: string, updates: Partial<ToolCallInfo>) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
}

let msgCounter = 0;

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,

  addMessage: (message) => {
    const id = `msg-${++msgCounter}-${Date.now()}`;
    set((state) => ({
      messages: [
        ...state.messages,
        { ...message, id, timestamp: Date.now() },
      ],
    }));
    return id;
  },

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  appendToMessage: (id, text) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + text } : m
      ),
    })),

  addToolCallToMessage: (messageId, toolCall) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, toolCalls: [...(m.toolCalls ?? []), toolCall] }
          : m
      ),
    })),

  updateToolCall: (messageId, toolCallId, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              toolCalls: m.toolCalls?.map((tc) =>
                tc.id === toolCallId ? { ...tc, ...updates } : tc
              ),
            }
          : m
      ),
    })),

  setStreaming: (streaming) => set({ isStreaming: streaming }),

  clearMessages: () => set({ messages: [], isStreaming: false }),
}));
