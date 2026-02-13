import { X } from 'lucide-react';
import { useEditorStore } from '@/lib/store/editor';
import { cn } from '@/lib/utils/format';

export default function FileTabs() {
  const openFiles = useEditorStore((s) => s.openFiles);
  const activeFilePath = useEditorStore((s) => s.activeFilePath);
  const setActiveFile = useEditorStore((s) => s.setActiveFile);
  const closeFile = useEditorStore((s) => s.closeFile);

  if (openFiles.length === 0) return null;

  return (
    <div className="flex items-center border-b border-border bg-card overflow-x-auto shrink-0">
      {openFiles.map((file) => {
        const fileName = file.path.split('/').pop() ?? file.path;
        const isActive = file.path === activeFilePath;

        return (
          <div
            key={file.path}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs border-r border-border cursor-pointer group transition-colors min-w-0 shrink-0',
              isActive
                ? 'bg-background text-foreground border-b-2 border-b-primary'
                : 'bg-card text-muted-foreground hover:text-foreground hover:bg-accent/30',
            )}
            onClick={() => setActiveFile(file.path)}
          >
            <span className="truncate max-w-32">
              {file.isDirty && <span className="text-primary mr-0.5">*</span>}
              {fileName}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-accent rounded p-0.5 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
