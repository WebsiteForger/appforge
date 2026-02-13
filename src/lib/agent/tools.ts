import type { LLMToolDefinition } from '../llm/client';
import * as fs from '../webcontainer/filesystem';
import { spawnCommand } from '../webcontainer/process';
import { capturePreviewScreenshot } from './screenshot';
import { formatErrorReport, clearErrors } from './errors';
import { truncateToolResult } from './context';
import { useEditorStore } from '../store/editor';
import { useChatStore } from '../store/chat';

// Current dev server URL (set by PreviewPanel when server-ready fires)
let currentServerUrl: string | null = null;

export function setServerUrl(url: string | null) {
  currentServerUrl = url;
}

export function getServerUrl(): string | null {
  return currentServerUrl;
}

// ── Tool Definitions (sent to the LLM) ──

export const TOOL_DEFINITIONS: LLMToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'write_file',
      description:
        'Create or overwrite a file. Always write COMPLETE file contents. Never use placeholders or "// rest of code".',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'File path relative to project root, e.g. src/pages/Home.tsx',
          },
          content: {
            type: 'string',
            description: 'Complete file content',
          },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description:
        'Read the contents of a file. Use this to check existing code before modifying it.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'File path to read',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description:
        'List files and directories. Use to understand project structure.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: "Directory path (default: '.')",
          },
          recursive: {
            type: 'boolean',
            description: 'List recursively (default: true)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_file',
      description: 'Delete a file or directory.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to delete',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_command',
      description:
        'Run a shell command in the project directory. Use for: npm install, npm run build, npx commands, etc. Returns stdout + stderr.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Shell command to run',
          },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_errors',
      description:
        'Check for current errors in the running application. Returns terminal errors, browser console errors, and Vite HMR errors. Call after making changes to verify they work.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'screenshot',
      description:
        'Take a screenshot of the running app in the preview iframe. Returns a base64 image. Use to VERIFY your work — check if the UI looks correct.',
      parameters: {
        type: 'object',
        properties: {
          fullPage: {
            type: 'boolean',
            description: 'Capture full scrollable page (default: false)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_files',
      description:
        'Search for a text pattern across all project files. Like grep. WARNING: Do not call this more than 2 times in a row. If you already searched and found the file, READ it with read_file and FIX it with write_file instead of searching again.',
      parameters: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'Text or regex to search for',
          },
          filePattern: {
            type: 'string',
            description: "Glob pattern for files to search, e.g. '*.tsx' (default: all files)",
          },
        },
        required: ['pattern'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_sql',
      description:
        'Execute SQL against the local PGlite database. Use to create tables, insert seed data, query data to verify it works.',
      parameters: {
        type: 'object',
        properties: {
          sql: {
            type: 'string',
            description: 'SQL query to execute',
          },
        },
        required: ['sql'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'db_tables',
      description:
        'List all tables and their columns in the local PGlite database.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'task_complete',
      description:
        'Call this when you have FULLY finished building the application. ' +
        'Only call this after all files are written, errors are fixed, ' +
        'and the app is working. Include a brief summary of what was built.',
      parameters: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Brief summary of what was built and key features',
          },
        },
        required: ['summary'],
      },
    },
  },
];

// ── Tool Executors ──

export type ToolExecutor = (
  args: Record<string, unknown>,
) => Promise<string | { type: 'image'; data: string }>;

export const TOOL_EXECUTORS: Record<string, ToolExecutor> = {
  write_file: async (args) => {
    const path = args.path as string;
    const content = args.content as string;
    await fs.writeFile(path, content);

    // Update editor state
    const editorStore = useEditorStore.getState();
    const existing = editorStore.openFiles.find((f) => f.path === path);
    if (existing) {
      editorStore.updateFileContent(path, content);
    }

    // Auto-open important files in the editor (e.g. PLAN.md)
    const autoOpenFiles = ['PLAN.md', 'plan.md'];
    if (autoOpenFiles.some((f) => path.endsWith(f))) {
      editorStore.openFile(path, content);
    }

    // Refresh file tree
    const tree = await fs.buildFileTree();
    editorStore.setFileTree(tree);

    const lines = content.split('\n').length;
    return `Wrote ${path} (${lines} lines)`;
  },

  read_file: async (args) => {
    const path = args.path as string;
    const content = await fs.readFile(path);
    return truncateToolResult(content);
  },

  list_files: async (args) => {
    const path = (args.path as string) || '.';
    const recursive = args.recursive !== false;

    if (recursive) {
      const files = await fs.listFilesRecursive(path);
      return files.join('\n');
    }

    const entries = await fs.readDir(path);
    return entries
      .map((e) => `${e.isDirectory ? '📁' : '📄'} ${e.name}`)
      .join('\n');
  },

  delete_file: async (args) => {
    const path = args.path as string;
    await fs.deleteFile(path);

    const editorStore = useEditorStore.getState();
    editorStore.closeFile(path);
    const tree = await fs.buildFileTree();
    editorStore.setFileTree(tree);

    return `Deleted ${path}`;
  },

  run_command: async (args) => {
    const command = (args.command as string).trim();

    // Normalize: collapse whitespace, lowercase for matching
    const normalized = command.replace(/\s+/g, ' ').toLowerCase();

    // Block long-running/server commands — the boot process already handles these
    const blocked = ['npm run dev', 'npm start', 'npx vite', 'vite', 'node server', 'yarn dev', 'pnpm dev', 'npx serve', 'http-server'];
    if (blocked.some((b) => normalized.startsWith(b))) {
      return 'Error: Dev server is already running (started automatically). Do not start it yourself. Use check_errors() or screenshot() to verify the app.';
    }

    // Run with a 60s timeout to prevent accidental hangs
    const result = await Promise.race([
      spawnCommand(command),
      new Promise<{ exitCode: number; output: string }>((_, reject) =>
        setTimeout(() => reject(new Error('Command timed out after 60 seconds')), 60000),
      ),
    ]);
    const output = truncateToolResult(result.output);
    return `Exit code: ${result.exitCode}\n\n${output}`;
  },

  check_errors: async () => {
    return formatErrorReport();
  },

  screenshot: async (args) => {
    const fullPage = (args.fullPage as boolean) || false;
    const result = await capturePreviewScreenshot(fullPage);

    if (!result) {
      return 'Screenshot unavailable — preview iframe not found or not loaded.';
    }

    if (result.startsWith('data:image/')) {
      return { type: 'image', data: result };
    }

    // Text fallback (DOM description)
    return result;
  },

  search_files: async (args) => {
    const pattern = args.pattern as string;
    const allFiles = await fs.listFilesRecursive();
    const results: string[] = [];

    for (const filePath of allFiles) {
      try {
        const content = await fs.readFile(filePath);
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(pattern)) {
            results.push(`${filePath}:${i + 1}: ${lines[i].trim()}`);
          }
        }
      } catch {
        // Skip unreadable files
      }
    }

    if (results.length === 0) {
      return `No matches found for "${pattern}"`;
    }

    return truncateToolResult(results.join('\n'));
  },

  run_sql: async (args) => {
    const sql = args.sql as string;
    if (!currentServerUrl) {
      return 'Error: Dev server not running. Run `npm run dev` first.';
    }

    try {
      const res = await fetch(`${currentServerUrl}/__dev/sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });
      const data = await res.json();

      if (data.error) return `SQL Error: ${data.error}`;
      return `${data.rows?.length ?? 0} rows\n${JSON.stringify(data.rows, null, 2)}`;
    } catch (err) {
      return `SQL request failed: ${err}`;
    }
  },

  task_complete: async (args) => {
    const summary = args.summary as string;

    // Add a friendly completion message to chat
    useChatStore.getState().addMessage({
      role: 'assistant',
      content: `Build complete! Here's what was built:\n\n${summary}`,
    });

    // Save file snapshot to IndexedDB
    try {
      const { saveFileSnapshot } = await import('../store/file-persistence');
      const projectId = (window as any).__appforge_projectId;
      if (projectId) await saveFileSnapshot(projectId);
    } catch {
      // Non-fatal
    }

    return 'Task completed successfully.';
  },

  db_tables: async () => {
    if (!currentServerUrl) {
      return 'Error: Dev server not running.';
    }

    const sql = `
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;

    try {
      const res = await fetch(`${currentServerUrl}/__dev/sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });
      const data = await res.json();
      if (data.error) return `Error: ${data.error}`;
      return JSON.stringify(data.rows, null, 2);
    } catch (err) {
      return `Request failed: ${err}`;
    }
  },
};
