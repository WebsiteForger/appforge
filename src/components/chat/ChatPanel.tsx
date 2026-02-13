import { useEffect, useRef, useCallback } from 'react';
import { Bot } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import PlanView from './PlanView';
import ModeSwitcher from './ModeSwitcher';
import { useChatStore } from '@/lib/store/chat';
import { useAgentStore } from '@/lib/store/agent';
import { runAgentLoop } from '@/lib/agent/engine';

export default function ChatPanel() {
  const messages = useChatStore((s) => s.messages);
  const phase = useAgentStore((s) => s.phase);
  const iterations = useAgentStore((s) => s.iterations);
  const currentToolName = useAgentStore((s) => s.currentToolName);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter out internal system messages and empty assistant bubbles from display
  const visibleMessages = messages.filter((m) => {
    // Hide empty assistant messages (no text, no tool calls)
    if (m.role === 'assistant' && !m.content && (!m.toolCalls || m.toolCalls.length === 0) && !m.isStreaming) {
      return false;
    }
    if (m.role !== 'system') return true;
    // Hide internal nudge messages (but show LLM errors so user can debug)
    if (m.content.startsWith('Nudging AI')) return false;
    if (m.content.includes('malformed arguments')) return false;
    return true;
  });

  // Reliable auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentToolName, scrollToBottom]);

  // Also scroll on content mutations (streaming text)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new MutationObserver(scrollToBottom);
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [scrollToBottom]);

  function handleSend(message: string) {
    runAgentLoop(message);
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-8 flex items-center justify-between px-3 border-b border-border bg-card shrink-0">
        <ModeSwitcher />
        {phase !== 'idle' && phase !== 'done' && (
          <span className="text-[10px] text-muted-foreground">
            Turn {iterations}
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {visibleMessages.length === 0 && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Start Building</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Describe the app you want to build, and the AI will create it step by step in real time.
              </p>
            </div>
            <div className="space-y-1.5 w-full max-w-64">
              {[
                'Build me a todo app with auth',
                'Create a blog with comments',
                'Make a dashboard with charts',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="w-full text-left px-3 py-2 text-xs bg-muted rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          visibleMessages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}
      </div>

      {/* Plan approval UI */}
      <PlanView />

      {/* Agent status bar */}
      {currentToolName && (
        <div className="px-3 py-1.5 border-t border-border bg-primary/5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          <span className="text-[10px] text-primary font-medium">
            {currentToolName}...
          </span>
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}
