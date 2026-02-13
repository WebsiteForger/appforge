import { useEffect, useRef } from 'react';
import { TerminalSquare } from 'lucide-react';

// We use a simple div-based terminal for now since xterm.js needs careful
// lifecycle management. This captures all WebContainer output.

const terminalLines: string[] = [];
const MAX_LINES = 500;
let listeners: Set<() => void> = new Set();

export function appendTerminalLine(data: string) {
  // Split data into lines and add each
  const lines = data.split('\n');
  for (const line of lines) {
    if (line.trim()) {
      terminalLines.push(line);
      if (terminalLines.length > MAX_LINES) {
        terminalLines.shift();
      }
    }
  }
  // Notify listeners
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
  const forceUpdate = useRef(0);

  useEffect(() => {
    const listener = () => {
      forceUpdate.current++;
      // Force re-render
      scrollRef.current?.dispatchEvent(new Event('update'));
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Use MutationObserver pattern to trigger re-renders
  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="h-7 flex items-center justify-between px-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-1.5 text-xs">
          <TerminalSquare className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium text-muted-foreground">Terminal</span>
        </div>
        <button
          onClick={clearTerminal}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      </div>
      <div
        ref={scrollRef}
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
