import { useEffect, useRef, useState, useCallback } from 'react';
import { TerminalSquare } from 'lucide-react';

// We use a simple div-based terminal for now since xterm.js needs careful
// lifecycle management. This captures all WebContainer output.

const terminalLines: string[] = [];
const MAX_LINES = 500;
let listeners: Set<() => void> = new Set();

// Strip ANSI escape codes so terminal output is readable
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]|\x1b\[\?[0-9;]*[a-zA-Z]|\x1b\][^\x07]*\x07/g, '');
}

export function appendTerminalLine(data: string) {
  const cleaned = stripAnsi(data);
  const lines = cleaned.split('\n');
  for (const line of lines) {
    if (line.trim()) {
      terminalLines.push(line);
      if (terminalLines.length > MAX_LINES) {
        terminalLines.shift();
      }
    }
  }
  for (const listener of listeners) {
    listener();
  }
}

export function clearTerminal() {
  terminalLines.length = 0;
  for (const listener of listeners) {
    listener();
  }
}

export default function TerminalPanel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, setTick] = useState(0);
  const userScrolledUp = useRef(false);

  // Check if user has scrolled away from bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    userScrolledUp.current = !atBottom;
  }, []);

  useEffect(() => {
    const listener = () => {
      setTick((t) => t + 1);
      // Only auto-scroll if user hasn't scrolled up
      if (!userScrolledUp.current && scrollRef.current) {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        });
      }
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="h-7 flex items-center justify-between px-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-1.5 text-xs">
          <TerminalSquare className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium text-muted-foreground">Terminal</span>
        </div>
        <button
          onClick={() => { clearTerminal(); userScrolledUp.current = false; }}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 font-mono text-[11px] leading-relaxed text-green-400/80"
      >
        {terminalLines.length === 0 ? (
          <span className="text-muted-foreground">$ Waiting for commands...</span>
        ) : (
          terminalLines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-all">
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
