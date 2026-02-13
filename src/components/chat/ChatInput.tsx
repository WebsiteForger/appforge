import { useState, useRef, useCallback } from 'react';
import { Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgentStore } from '@/lib/store/agent';

interface ChatInputProps {
  onSend: (message: string) => void;
}

export default function ChatInput({ onSend }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isRunning = useAgentStore((s) => s.isRunning);
  const stop = useAgentStore((s) => s.stop);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isRunning) return;
    setInput('');
    onSend(trimmed);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isRunning, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  };

  return (
    <div className="border-t border-border p-3">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={isRunning ? 'AI is working...' : 'Describe what you want to build...'}
            disabled={isRunning}
            rows={1}
            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50 pr-10"
          />
        </div>

        {isRunning ? (
          <Button
            variant="destructive"
            size="icon"
            onClick={stop}
            title="Stop agent"
          >
            <Square className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim()}
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground mt-2">
        Shift+Enter for new line
      </p>
    </div>
  );
}
