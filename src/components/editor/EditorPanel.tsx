import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Files, Code } from 'lucide-react';
import FileTree from './FileTree';
import FileTabs from './FileTabs';
import CodeEditor from './CodeEditor';
import { cn } from '@/lib/utils/format';

export default function EditorPanel() {
  const [showFileTree, setShowFileTree] = useState(true);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Editor Header */}
      <div className="h-8 flex items-center px-2 border-b border-border bg-card shrink-0">
        <button
          onClick={() => setShowFileTree(!showFileTree)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-0.5 text-xs rounded transition-colors',
            showFileTree
              ? 'text-foreground bg-accent'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Files className="w-3.5 h-3.5" />
          Files
        </button>
        <div className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Code className="w-3.5 h-3.5" />
          Editor
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal">
          {showFileTree && (
            <>
              <Panel defaultSize={30} minSize={15} maxSize={50}>
                <div className="h-full border-r border-border overflow-hidden">
                  <FileTree />
                </div>
              </Panel>
              <PanelResizeHandle className="w-0.5 bg-transparent hover:bg-primary/30 transition-colors" />
            </>
          )}
          <Panel defaultSize={showFileTree ? 70 : 100}>
            <div className="h-full flex flex-col">
              <FileTabs />
              <div className="flex-1">
                <CodeEditor />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
