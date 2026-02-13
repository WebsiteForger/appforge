import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { getFileIcon } from '@/lib/utils/file-icons';
import { cn } from '@/lib/utils/format';
import type { FileNode } from '@/lib/store/editor';

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  isExpanded: boolean;
  isActive: boolean;
  onToggle: () => void;
  onClick: () => void;
}

export default function FileTreeItem({
  node,
  depth,
  isExpanded,
  isActive,
  onToggle,
  onClick,
}: FileTreeItemProps) {
  const isDir = node.type === 'directory';
  const iconInfo = getFileIcon(node.name);

  // Get the lucide icon component dynamically
  const IconComponent = isDir
    ? isExpanded
      ? FolderOpen
      : Folder
    : (LucideIcons as Record<string, unknown>)[iconInfo.icon] as typeof LucideIcons.File ?? LucideIcons.File;

  return (
    <button
      onClick={isDir ? onToggle : onClick}
      className={cn(
        'w-full flex items-center gap-1.5 px-2 py-[3px] text-xs hover:bg-accent/50 transition-colors text-left',
        isActive && !isDir && 'bg-accent text-accent-foreground',
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      {isDir && (
        <span className="w-3 h-3 flex items-center justify-center shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
        </span>
      )}
      {!isDir && <span className="w-3 h-3 shrink-0" />}

      <IconComponent
        className="w-3.5 h-3.5 shrink-0"
        style={{ color: isDir ? '#a1a1aa' : iconInfo.color }}
      />
      <span className="truncate text-muted-foreground">{node.name}</span>
    </button>
  );
}
