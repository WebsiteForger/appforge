import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { type ReactNode } from 'react';

interface PanelLayoutProps {
  chatPanel: ReactNode;
  editorPanel: ReactNode;
  previewPanel: ReactNode;
}

function ResizeHandle({ className }: { className?: string }) {
  return (
    <PanelResizeHandle
      className={`w-1 bg-transparent hover:bg-primary/30 active:bg-primary/50 transition-colors ${className ?? ''}`}
    />
  );
}

export default function PanelLayout({ chatPanel, editorPanel, previewPanel }: PanelLayoutProps) {
  return (
    <PanelGroup direction="horizontal" className="flex-1">
      {/* Chat Panel — 25% default */}
      <Panel defaultSize={25} minSize={15} maxSize={40}>
        <div className="h-full overflow-hidden flex flex-col">{chatPanel}</div>
      </Panel>

      <ResizeHandle />

      {/* Editor Panel — 40% default */}
      <Panel defaultSize={40} minSize={20}>
        <div className="h-full overflow-hidden flex flex-col">{editorPanel}</div>
      </Panel>

      <ResizeHandle />

      {/* Preview Panel — 35% default */}
      <Panel defaultSize={35} minSize={20}>
        <div className="h-full overflow-hidden flex flex-col">{previewPanel}</div>
      </Panel>
    </PanelGroup>
  );
}
