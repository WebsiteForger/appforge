import { useEffect, useState } from 'react';
import { Bug, Trash2 } from 'lucide-react';
import { getConsoleErrors, clearErrors } from '@/lib/agent/errors';

export default function ConsolePanel() {
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setErrors([...getConsoleErrors()]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="h-7 flex items-center justify-between px-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-1.5 text-xs">
          <Bug className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium text-muted-foreground">Console</span>
          {errors.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive text-[10px] font-medium">
              {errors.length}
            </span>
          )}
        </div>
        <button
          onClick={() => {
            clearErrors();
            setErrors([]);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px]">
        {errors.length === 0 ? (
          <span className="text-muted-foreground">No console errors</span>
        ) : (
          errors.map((err, i) => (
            <div
              key={i}
              className="text-red-400 py-0.5 border-b border-border/30 whitespace-pre-wrap break-all"
            >
              {err}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
