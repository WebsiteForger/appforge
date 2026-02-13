const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN!;
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
  // GET: Check deploy status
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    if (!siteId) {
      return Response.json({ error: 'Missing siteId' }, { status: 400 });
    }

    try {
      const deploys = await netlifyFetch(`/sites/${siteId}/deploys?per_page=1`);
      const latest = deploys[0];
      if (!latest) {
        return Response.json({ state: 'none' });
      }

      return Response.json({
        id: latest.id,
        state: latest.state,
        errorMessage: latest.error_message,
        deployUrl: latest.deploy_ssl_url,
        createdAt: latest.created_at,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get status';
      return Response.json({ error: message }, { status: 500 });
    }
  }

  // POST: Trigger deploy
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { siteId } = await req.json();

  if (!siteId) {
    return Response.json({ error: 'Missing siteId' }, { status: 400 });
  }

  try {
    const deploy = await netlifyFetch(`/sites/${siteId}/builds`, {
      method: 'POST',
    });

    return Response.json({
      deployId: deploy.deploy_id || deploy.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to trigger deploy';
    return Response.json({ error: message }, { status: 500 });
  }
};
