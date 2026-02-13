import Editor from '@monaco-editor/react';
import { useEditorStore } from '@/lib/store/editor';
import { writeFile } from '@/lib/webcontainer/filesystem';
import { getLanguageFromPath } from '@/lib/utils/format';

export default function CodeEditor() {
  const activeFilePath = useEditorStore((s) => s.activeFilePath);
  const openFiles = useEditorStore((s) => s.openFiles);
  const updateFileContent = useEditorStore((s) => s.updateFileContent);
  const markFileSaved = useEditorStore((s) => s.markFileSaved);

  const activeFile = openFiles.find((f) => f.path === activeFilePath);

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Select a file to edit
      </div>
    );
  }

  const language = getLanguageFromPath(activeFile.path);

  async function handleChange(value: string | undefined) {
    if (!value || !activeFilePath) return;
    updateFileContent(activeFilePath, value);

    // Auto-save to WebContainer
    try {
      await writeFile(activeFilePath, value);
      markFileSaved(activeFilePath);
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  }

  return (
    <Editor
      height="100%"
      language={language}
      value={activeFile.content}
      onChange={handleChange}
      theme="vs-dark"
      options={{
        fontSize: 13,
        fontFamily: '"JetBrains Mono", monospace',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        lineNumbers: 'on',
        renderWhitespace: 'none',
        padding: { top: 8 },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        formatOnPaste: true,
      }}
    />
  );
}
