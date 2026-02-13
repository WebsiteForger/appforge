/**
 * Generate a diff between two file states to minimize commit size.
 */

export interface FileDiff {
  path: string;
  content: string;
  status: 'added' | 'modified' | 'deleted';
}

export function diffFiles(
  oldFiles: Map<string, string>,
  newFiles: Map<string, string>,
): FileDiff[] {
  const diffs: FileDiff[] = [];

  // Check for added/modified files
  for (const [path, content] of newFiles) {
    const oldContent = oldFiles.get(path);
    if (oldContent === undefined) {
      diffs.push({ path, content, status: 'added' });
    } else if (oldContent !== content) {
      diffs.push({ path, content, status: 'modified' });
    }
  }

  // Check for deleted files
  for (const path of oldFiles.keys()) {
    if (!newFiles.has(path)) {
      diffs.push({ path, content: '', status: 'deleted' });
    }
  }

  return diffs;
}
