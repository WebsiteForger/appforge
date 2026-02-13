import { verifyToken } from '@clerk/backend';

/**
 * Verify the Clerk JWT from the Authorization header.
 * Returns the userId if valid, throws if not.
 * Skips verification when CLERK_SECRET_KEY is not set (dev mode).
 */
export async function verifyAuth(req: Request): Promise<string> {
  const secretKey = process.env.CLERK_SECRET_KEY;

  // Skip auth in dev when Clerk is not configured
  if (!secretKey) {
    return 'dev-user';
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyToken(token, { secretKey });
    if (!payload.sub) throw new Error('Invalid token');
    return payload.sub;
  } catch {
    throw new Error('Unauthorized');
  }
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
