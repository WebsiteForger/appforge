import { useEditorStore } from '@/lib/store/editor';
import { readFile } from '@/lib/webcontainer/filesystem';
import FileTreeItem from './FileTreeItem';
import type { FileNode } from '@/lib/store/editor';
import { FolderOpen } from 'lucide-react';

export default function FileTree() {
  const fileTree = useEditorStore((s) => s.fileTree);
  const expandedDirs = useEditorStore((s) => s.expandedDirs);
  const activeFilePath = useEditorStore((s) => s.activeFilePath);
  const toggleDir = useEditorStore((s) => s.toggleDir);
  const openFile = useEditorStore((s) => s.openFile);

  async function handleFileClick(node: FileNode) {
    try {
      const content = await readFile(node.path);
      openFile(node.path, content);
    } catch (err) {
      console.error('Failed to read file:', err);
    }
  }

  function renderNode(node: FileNode, depth: number) {
    const isExpanded = expandedDirs.has(node.path);
    const isActive = node.path === activeFilePath;

    return (
      <div key={node.path}>
        <FileTreeItem
          node={node}
          depth={depth}
          isExpanded={isExpanded}
          isActive={isActive}
          onToggle={() => toggleDir(node.path)}
          onClick={() => handleFileClick(node)}
        />
        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  if (fileTree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 p-4">
        <FolderOpen className="w-8 h-8 opacity-50" />
        <p>No files yet</p>
      </div>
    );
  }

  return (
    <div className="py-1 overflow-y-auto h-full">
      {fileTree.map((node) => renderNode(node, 0))}
    </div>
  );
}
