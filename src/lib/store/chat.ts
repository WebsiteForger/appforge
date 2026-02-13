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
  currentProjectId: string | null;

  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  appendToMessage: (id: string, text: string) => void;
  addToolCallToMessage: (messageId: string, toolCall: ToolCallInfo) => void;
  updateToolCall: (messageId: string, toolCallId: string, updates: Partial<ToolCallInfo>) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
  loadForProject: (projectId: string) => void;
  saveToStorage: () => void;
}

function chatStorageKey(projectId: string) {
  return `appforge-chat-${projectId}`;
}

let msgCounter = 0;

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentProjectId: null,

  addMessage: (message) => {
    const id = `msg-${++msgCounter}-${Date.now()}`;
    set((state) => ({
      messages: [
        ...state.messages,
        { ...message, id, timestamp: Date.now() },
      ],
    }));
    // Auto-save after adding a non-streaming message
    if (!message.isStreaming) {
      setTimeout(() => get().saveToStorage(), 0);
    }
    return id;
  },

  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
    // Auto-save when streaming finishes
    if (updates.isStreaming === false) {
      setTimeout(() => get().saveToStorage(), 0);
    }
  },

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

  clearMessages: () => {
    // Save empty state to storage
    const { currentProjectId } = get();
    set({ messages: [], isStreaming: false });
    if (currentProjectId) {
      localStorage.removeItem(chatStorageKey(currentProjectId));
    }
  },

  loadForProject: (projectId: string) => {
    // Save current project's chat before switching
    const { currentProjectId } = get();
    if (currentProjectId && currentProjectId !== projectId) {
      get().saveToStorage();
    }

    // Load chat for the new project
    try {
      const stored = localStorage.getItem(chatStorageKey(projectId));
      if (stored) {
        const messages: ChatMessage[] = JSON.parse(stored);
        // Strip streaming flags from restored messages
        const cleaned = messages.map((m) => ({ ...m, isStreaming: false }));
        set({ messages: cleaned, isStreaming: false, currentProjectId: projectId });
        return;
      }
    } catch {
      // ignore parse errors
    }
    set({ messages: [], isStreaming: false, currentProjectId: projectId });
  },

  saveToStorage: () => {
    const { messages, currentProjectId } = get();
    if (!currentProjectId || messages.length === 0) return;
    // Only save non-streaming, completed messages
    const toSave = messages
      .filter((m) => !m.isStreaming)
      .map((m) => ({
        ...m,
        // Strip running tool calls to avoid stale state
        toolCalls: m.toolCalls?.map((tc) => ({ ...tc, isRunning: false })),
      }));
    try {
      localStorage.setItem(chatStorageKey(currentProjectId), JSON.stringify(toSave));
    } catch {
      // localStorage might be full — ignore
    }
  },
}));
