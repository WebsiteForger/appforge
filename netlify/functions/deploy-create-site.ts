const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN!;
const NETLIFY_ACCOUNT = process.env.NETLIFY_ACCOUNT_SLUG!;
const GITHUB_INSTALLATION_ID = process.env.NETLIFY_GITHUB_INSTALLATION_ID!;
const GITHUB_ORG = process.env.GITHUB_ORG!;
const API = 'https://api.netlify.com/api/v1';

async function netlifyFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${NETLIFY_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Netlify API error ${res.status}: ${text}`);
  }
  return res.json();
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { repoName } = await req.json();

  if (!repoName) {
    return Response.json({ error: 'Missing repoName' }, { status: 400 });
  }

  try {
    // Create a deploy key
    const deployKey = await netlifyFetch('/deploy_keys', { method: 'POST' });

    // Create site linked to the GitHub repo
    const site = await netlifyFetch(`/${NETLIFY_ACCOUNT}/sites`, {
      method: 'POST',
      body: JSON.stringify({
        name: repoName,
        repo: {
          provider: 'github',
          repo: `${GITHUB_ORG}/${repoName}`,
          branch: 'main',
          cmd: 'npm run build',
          dir: 'dist',
          installation_id: GITHUB_INSTALLATION_ID,
          deploy_key_id: deployKey.id,
        },
      }),
    });

    return Response.json({
      siteId: site.id,
      siteName: site.name,
      url: site.ssl_url || `https://${site.name}.netlify.app`,
      adminUrl: site.admin_url,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create site';
    return Response.json({ error: message }, { status: 500 });
  }
};
