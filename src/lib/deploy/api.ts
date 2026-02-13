/**
 * Deployment API — called client-side, routes through Netlify Functions.
 * Creates Netlify sites linked to GitHub repos and triggers deploys.
 * Uses the same Netlify account as SiteForge.
 */

import { authFetch } from '../utils/auth-fetch';

export interface DeployResult {
  siteId: string;
  siteName: string;
  url: string;
  adminUrl: string;
}

export interface DeployStatus {
  id: string;
  state: 'building' | 'ready' | 'error' | 'enqueued';
  errorMessage?: string;
  deployUrl?: string;
  createdAt: string;
}

/**
 * Create a new Netlify site linked to a GitHub repo
 */
export async function createSite(repoName: string, includeAuth = false): Promise<DeployResult> {
  const res = await authFetch('/.netlify/functions/deploy-create-site', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoName, includeAuth }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create Netlify site');
  }

  return res.json();
}

/**
 * Trigger a deploy for an existing site
 */
export async function triggerDeploy(siteId: string): Promise<{ deployId: string }> {
  const res = await authFetch('/.netlify/functions/deploy-trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siteId }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to trigger deploy');
  }

  return res.json();
}

/**
 * Poll deploy status
 */
export async function getDeployStatus(siteId: string): Promise<DeployStatus | null> {
  const res = await authFetch(`/.netlify/functions/deploy-trigger?siteId=${siteId}`, {
    method: 'GET',
  });

  if (!res.ok) return null;
  return res.json();
}

/**
 * Full deploy flow: commit files to GitHub, then trigger Netlify deploy
 */
export async function fullDeploy(
  repo: string,
  files: { path: string; content: string }[],
  siteId: string | null,
  includeAuth = false,
): Promise<{ siteId: string; url: string; deployId: string }> {
  // 1. Commit files to GitHub
  const { commitFiles } = await import('../github/api');
  await commitFiles(repo, files, 'Deploy from AppForge');

  // 2. Create site if first deploy
  let resolvedSiteId = siteId;
  let url = '';

  if (!resolvedSiteId) {
    const site = await createSite(repo, includeAuth);
    resolvedSiteId = site.siteId;
    url = site.url;
  }

  // 3. Trigger deploy
  const { deployId } = await triggerDeploy(resolvedSiteId);

  return { siteId: resolvedSiteId, url, deployId };
}
