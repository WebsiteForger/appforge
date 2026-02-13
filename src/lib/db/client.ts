/**
 * Drizzle client for AppForge's own platform database (Netlify DB).
 * This is for the platform data (users, projects, conversations),
 * NOT for the user's app database.
 *
 * In production: uses Netlify DB (Neon Postgres).
 * In dev: server-side functions still need DATABASE_URL.
 */

// Note: This file is used by Netlify Functions only (server-side).
// The client-side app calls Netlify Functions via fetch.

export async function getDb() {
  const { drizzle } = await import('drizzle-orm/neon-http');
  const { neon } = await import('@neondatabase/serverless');
  const schema = await import('../../../db/schema');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not set. Netlify DB not provisioned.');
  }

  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}
