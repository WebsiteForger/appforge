import { getWebContainer } from './instance';

export async function readFile(path: string): Promise<string> {
  const wc = await getWebContainer();
  return await wc.fs.readFile(path, 'utf-8');
}

export async function writeFile(path: string, content: string): Promise<void> {
  const wc = await getWebContainer();

  // Ensure parent directories exist
  const parts = path.split('/');
  if (parts.length > 1) {
    const dir = parts.slice(0, -1).join('/');
    await mkdirp(dir);
  }

  await wc.fs.writeFile(path, content);
}

export async function deleteFile(path: string): Promise<void> {
  const wc = await getWebContainer();
  await wc.fs.rm(path, { recursive: true });
}

export async function mkdirp(path: string): Promise<void> {
  const wc = await getWebContainer();
  try {
    await wc.fs.mkdir(path, { recursive: true });
  } catch {
    // Directory may already exist
  }
}

export interface DirEntry {
  name: string;
  isDirectory: boolean;
}

export async function readDir(path: string): Promise<DirEntry[]> {
  const wc = await getWebContainer();
  const entries = await wc.fs.readdir(path, { withFileTypes: true });
  return entries.map((entry) => ({
    name: entry.name,
    isDirectory: entry.isDirectory(),
  }));
}

export async function listFilesRecursive(
  basePath: string = '.',
  prefix: string = '',
): Promise<string[]> {
  const files: string[] = [];
  const entries = await readDir(basePath);

  for (const entry of entries) {
    const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;

    // Skip node_modules and hidden directories
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name.startsWith('.')) {
      continue;
    }

    if (entry.isDirectory) {
      const childPath = basePath === '.' ? entry.name : `${basePath}/${entry.name}`;
      const children = await listFilesRecursive(childPath, fullPath);
      files.push(...children);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    const wc = await getWebContainer();
    await wc.fs.readFile(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build a tree structure of the WebContainer filesystem
 */
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
}

export async function buildFileTree(basePath: string = '.'): Promise<FileTreeNode[]> {
  const entries = await readDir(basePath);
  const nodes: FileTreeNode[] = [];

  // Sort: directories first, then files, both alphabetical
  const sorted = entries.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of sorted) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;

    const entryPath = basePath === '.' ? entry.name : `${basePath}/${entry.name}`;

    if (entry.isDirectory) {
      const children = await buildFileTree(entryPath);
      nodes.push({
        name: entry.name,
        path: entryPath,
        type: 'directory',
        children,
      });
    } else {
      nodes.push({
        name: entry.name,
        path: entryPath,
        type: 'file',
      });
    }
  }

  return nodes;
}
