import { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import PlanView from './PlanView';
import { useChatStore } from '@/lib/store/chat';
import { useAgentStore } from '@/lib/store/agent';
import { runAgentLoop } from '@/lib/agent/engine';

export default function ChatPanel() {
  const messages = useChatStore((s) => s.messages);
  const phase = useAgentStore((s) => s.phase);
  const iterations = useAgentStore((s) => s.iterations);
  const currentToolName = useAgentStore((s) => s.currentToolName);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentToolName]);

  function handleSend(message: string) {
    runAgentLoop(message);
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="h-8 flex items-center justify-between px-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-1.5 text-xs">
          <Bot className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-muted-foreground">Chat</span>
        </div>
        {phase !== 'idle' && phase !== 'done' && (
          <span className="text-[10px] text-muted-foreground">
            Turn {iterations}
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
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
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
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
