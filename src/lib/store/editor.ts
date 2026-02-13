import { create } from 'zustand';

export interface OpenFile {
  path: string;
  content: string;
  isDirty: boolean;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface EditorState {
  openFiles: OpenFile[];
  activeFilePath: string | null;
  fileTree: FileNode[];
  expandedDirs: Set<string>;

  openFile: (path: string, content: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  setFileTree: (tree: FileNode[]) => void;
  toggleDir: (path: string) => void;
  markFileSaved: (path: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  openFiles: [],
  activeFilePath: null,
  fileTree: [],
  expandedDirs: new Set<string>(),

  openFile: (path, content) =>
    set((state) => {
      const existing = state.openFiles.find((f) => f.path === path);
      if (existing) {
        return { activeFilePath: path };
      }
      return {
        openFiles: [...state.openFiles, { path, content, isDirty: false }],
        activeFilePath: path,
      };
    }),

  closeFile: (path) =>
    set((state) => {
      const filtered = state.openFiles.filter((f) => f.path !== path);
      const newActive =
        state.activeFilePath === path
          ? filtered[filtered.length - 1]?.path ?? null
          : state.activeFilePath;
      return { openFiles: filtered, activeFilePath: newActive };
    }),

  setActiveFile: (path) => set({ activeFilePath: path }),

  updateFileContent: (path, content) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === path ? { ...f, content, isDirty: true } : f
      ),
    })),

  setFileTree: (tree) => set({ fileTree: tree }),

  toggleDir: (path) =>
    set((state) => {
      const next = new Set(state.expandedDirs);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedDirs: next };
    }),

  markFileSaved: (path) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === path ? { ...f, isDirty: false } : f
      ),
    })),
}));
