import { Octokit } from '@octokit/rest';
import { verifyAuth, unauthorized } from './lib/auth';

const GITHUB_ORG = process.env.GITHUB_ORG!;

function shortId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    await verifyAuth(req);
  } catch {
    return unauthorized();
  }

  const { projectName } = await req.json();

  if (!projectName || !/^[a-z0-9-]+$/.test(projectName)) {
    return Response.json(
      { error: 'Project name must be lowercase letters, numbers, and hyphens only' },
      { status: 400 },
    );
  }

  const githubToken = process.env.GITHUB_PAT;
  if (!githubToken) {
    return Response.json({ error: 'GitHub not configured' }, { status: 500 });
  }

  const octokit = new Octokit({ auth: githubToken });
  const repoName = `appforge-${projectName}-${shortId()}`;

  try {
    const repo = await octokit.repos.createInOrg({
      org: GITHUB_ORG,
      name: repoName,
      description: `Created with AppForge`,
      private: false,
      auto_init: true,
    });

    return Response.json({
      repo: repo.data.full_name,
      url: repo.data.html_url,
      name: repoName,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create repo';
    return Response.json({ error: message }, { status: 500 });
  }
};
