import { User, Bot, AlertCircle, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import StreamingMessage from './StreamingMessage';
import type { ChatMessage as ChatMessageType, ToolCallInfo } from '@/lib/store/chat';
import { cn } from '@/lib/utils/format';

function ToolCallCard({ toolCall }: { toolCall: ToolCallInfo }) {
  const [expanded, setExpanded] = useState(false);

  const toolLabels: Record<string, string> = {
    write_file: 'Writing',
    read_file: 'Reading',
    list_files: 'Listing files',
    delete_file: 'Deleting',
    run_command: 'Running',
    check_errors: 'Checking errors',
    screenshot: 'Taking screenshot',
    search_files: 'Searching',
    run_sql: 'Running SQL',
    db_tables: 'Listing tables',
  };

  const label = toolLabels[toolCall.name] ?? toolCall.name;
  const path = (toolCall.arguments as Record<string, string>)?.path ??
    (toolCall.arguments as Record<string, string>)?.command ?? '';

  return (
    <div className="border border-border rounded-lg overflow-hidden my-1.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-accent/30 transition-colors"
      >
        {toolCall.isRunning ? (
          <Loader2 className="w-3 h-3 text-primary animate-spin shrink-0" />
        ) : toolCall.isError ? (
          <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
        ) : (
          <span className="w-3 h-3 flex items-center justify-center text-success shrink-0">
            &#10003;
          </span>
        )}
        <span className="text-muted-foreground">{label}</span>
        {path && (
          <span className="text-foreground font-mono truncate">{path}</span>
        )}
        <span className="ml-auto shrink-0">
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
        </span>
      </button>
      {expanded && toolCall.result && (
        <div className="px-2.5 py-2 border-t border-border bg-zinc-900/50">
          <pre className="text-[10px] font-mono text-muted-foreground whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
            {toolCall.result}
          </pre>
        </div>
      )}
    </div>
  );
}

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={cn('px-4 py-3', isUser && 'bg-accent/20')}>
      <div className="flex gap-2.5 max-w-full">
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
          ) : isSystem ? (
            <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5 text-warning" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            {isUser ? 'You' : isSystem ? 'System' : 'AppForge AI'}
          </p>

          {message.content && (
            <div className="text-sm">
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <StreamingMessage
                  content={message.content}
                  isStreaming={message.isStreaming ?? false}
                />
              )}
            </div>
          )}

          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mt-2">
              {message.toolCalls.map((tc) => (
                <ToolCallCard key={tc.id} toolCall={tc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
