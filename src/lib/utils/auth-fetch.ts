/**
 * Auth-aware fetch utility.
 * Automatically injects the Clerk session token into requests
 * to /.netlify/functions/* endpoints.
 */

let _getToken: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

export async function authFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);

  if (_getToken) {
    try {
      const token = await _getToken();
      if (token) headers.set('Authorization', 'Bearer ' + token);
    } catch {
      // Auth not available
    }
  }

  return fetch(url, { ...init, headers });
}
