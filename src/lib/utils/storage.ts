const BASE_KEY = 'appforge-projects';

/**
 * Returns the localStorage key for projects, scoped to the current user.
 * Falls back to a shared key when no userId is available (shouldn't happen
 * behind auth, but keeps things safe).
 */
export function getProjectsKey(userId: string | null | undefined): string {
  return userId ? `${BASE_KEY}-${userId}` : BASE_KEY;
}
