import type { FileSystemTree } from '@webcontainer/api';
import { listFilesRecursive, readFile } from '../webcontainer/filesystem';

const DB_NAME = 'appforge-files';
const STORE_NAME = 'snapshots';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveFileSnapshot(projectId: string): Promise<void> {
  try {
    const paths = await listFilesRecursive();
    const files: Record<string, string> = {};

    for (const path of paths) {
      try {
        files[path] = await readFile(path);
      } catch {
        // Skip unreadable files
      }
    }

    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(files, projectId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn('Failed to save file snapshot:', err);
  }
}

export async function loadFileSnapshot(
  projectId: string,
): Promise<Record<string, string> | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(projectId);
    const result = await new Promise<Record<string, string> | undefined>(
      (resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      },
    );
    db.close();
    return result || null;
  } catch {
    return null;
  }
}

export async function deleteFileSnapshot(projectId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(projectId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore cleanup failures
  }
}

/**
 * Convert a flat path->content map to WebContainer's FileSystemTree format.
 */
export function filesToFileSystemTree(
  files: Record<string, string>,
): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const [path, content] of Object.entries(files)) {
    const parts = path.split('/');
    let current: any = tree;

    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts[i];
      if (!current[dir]) {
        current[dir] = { directory: {} };
      }
      current = current[dir].directory;
    }

    const fileName = parts[parts.length - 1];
    current[fileName] = { file: { contents: content } };
  }

  return tree;
}
