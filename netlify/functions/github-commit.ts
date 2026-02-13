import { Octokit } from '@octokit/rest';

const GITHUB_ORG = process.env.GITHUB_ORG!;

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { repo, files, message } = await req.json();

  if (!repo || !files?.length) {
    return Response.json({ error: 'Missing repo or files' }, { status: 400 });
  }

  const githubToken = process.env.GITHUB_PAT;
  if (!githubToken) {
    return Response.json({ error: 'GitHub not configured' }, { status: 500 });
  }

  const octokit = new Octokit({ auth: githubToken });

  try {
    // Get the current commit SHA (head of main)
    const { data: ref } = await octokit.git.getRef({
      owner: GITHUB_ORG,
      repo,
      ref: 'heads/main',
    });
    const latestCommitSha = ref.object.sha;

    // Get the tree of the latest commit
    const { data: latestCommit } = await octokit.git.getCommit({
      owner: GITHUB_ORG,
      repo,
      commit_sha: latestCommitSha,
    });

    // Create blobs for each file
    const treeItems = await Promise.all(
      files.map(async (file: { path: string; content: string }) => {
        const { data: blob } = await octokit.git.createBlob({
          owner: GITHUB_ORG,
          repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64',
        });

        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        };
      }),
    );

    // Create a new tree
    const { data: newTree } = await octokit.git.createTree({
      owner: GITHUB_ORG,
      repo,
      tree: treeItems,
      base_tree: latestCommit.tree.sha,
    });

    // Create a new commit
    const { data: newCommit } = await octokit.git.createCommit({
      owner: GITHUB_ORG,
      repo,
      message: message || 'Update from AppForge',
      tree: newTree.sha,
      parents: [latestCommitSha],
    });

    // Update the reference
    await octokit.git.updateRef({
      owner: GITHUB_ORG,
      repo,
      ref: 'heads/main',
      sha: newCommit.sha,
    });

    return Response.json({ sha: newCommit.sha });
  } catch (err: unknown) {
    const message2 = err instanceof Error ? err.message : 'Failed to commit';
    return Response.json({ error: message2 }, { status: 500 });
  }
};
