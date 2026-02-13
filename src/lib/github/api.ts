/**
 * GitHub integration — called from Netlify Functions (server-side only).
 * Creates repos, commits files, loads files for projects.
 * Uses the same GitHub org as SiteForge.
 */

import { authFetch } from '../utils/auth-fetch';

export interface CreateRepoPayload {
  projectName: string;
  userId: string;
  githubToken: string;
}

export interface CommitFilesPayload {
  repo: string;
  files: { path: string; content: string }[];
  message: string;
  githubToken: string;
}

/**
 * Client-side: call our Netlify Function to create a repo
 */
export async function createRepo(projectName: string): Promise<{ repo: string; url: string }> {
  const res = await authFetch('/.netlify/functions/github-create-repo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create repository');
  }

  return res.json();
}

/**
 * Client-side: call our Netlify Function to commit files
 */
export async function commitFiles(
  repo: string,
  files: { path: string; content: string }[],
  message: string = 'Update from AppForge',
): Promise<{ sha: string }> {
  const res = await authFetch('/.netlify/functions/github-commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo, files, message }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to commit files');
  }

  return res.json();
}

/**
 * Client-side: call our Netlify Function to load files from repo
 */
export async function getRepoFiles(
  repo: string,
): Promise<{ path: string; content: string }[]> {
  const res = await authFetch('/.netlify/functions/github-get-files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to load files');
  }

  return res.json();
}
