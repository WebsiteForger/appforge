import { Octokit } from '@octokit/rest';
import { verifyAuth, unauthorized } from './lib/auth';

const GITHUB_ORG = process.env.GITHUB_ORG!;

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    await verifyAuth(req);
  } catch {
    return unauthorized();
  }

  const { repo, branch } = await req.json();

  if (!repo) {
    return Response.json({ error: 'Missing repo' }, { status: 400 });
  }

  const githubToken = process.env.GITHUB_PAT;
  if (!githubToken) {
    return Response.json({ error: 'GitHub not configured' }, { status: 500 });
  }

  const octokit = new Octokit({ auth: githubToken });

  try {
    // Get the tree recursively
    const { data: ref } = await octokit.git.getRef({
      owner: GITHUB_ORG,
      repo,
      ref: `heads/${branch || 'main'}`,
    });

    const { data: commit } = await octokit.git.getCommit({
      owner: GITHUB_ORG,
      repo,
      commit_sha: ref.object.sha,
    });

    const { data: tree } = await octokit.git.getTree({
      owner: GITHUB_ORG,
      repo,
      tree_sha: commit.tree.sha,
      recursive: 'true',
    });

    // Fetch content for each file (skip directories and large files)
    const files: { path: string; content: string }[] = [];

    const blobPromises = tree.tree
      .filter((item) => item.type === 'blob' && (item.size ?? 0) < 100000)
      .map(async (item) => {
        try {
          const { data: blob } = await octokit.git.getBlob({
            owner: GITHUB_ORG,
            repo,
            file_sha: item.sha!,
          });

          if (blob.encoding === 'base64') {
            const content = Buffer.from(blob.content, 'base64').toString('utf-8');
            return { path: item.path!, content };
          }
          return { path: item.path!, content: blob.content };
        } catch {
          return null;
        }
      });

    const results = await Promise.all(blobPromises);
    for (const result of results) {
      if (result) files.push(result);
    }

    return Response.json(files);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to get files';
    return Response.json({ error: message }, { status: 500 });
  }
};
