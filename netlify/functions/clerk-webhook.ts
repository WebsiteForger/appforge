/**
 * Clerk webhook — syncs user data to our Netlify DB.
 * Fires on user.created / user.updated events.
 */

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Verify webhook signature (Clerk sends svix headers)
  // In production, verify using Clerk's webhook verification
  const payload = await req.json();
  const eventType = payload.type;

  if (!eventType) {
    return Response.json({ error: 'Missing event type' }, { status: 400 });
  }

  try {
    // Dynamic import to keep function lightweight when not needed
    const { neon } = await import('@neondatabase/serverless');
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.log('DATABASE_URL not set, skipping webhook');
      return Response.json({ ok: true, skipped: true });
    }

    const sql = neon(databaseUrl);

    const userData = payload.data;

    if (eventType === 'user.created' || eventType === 'user.updated') {
      const id = userData.id;
      const email = userData.email_addresses?.[0]?.email_address ?? '';
      const name = `${userData.first_name ?? ''} ${userData.last_name ?? ''}`.trim();
      const avatarUrl = userData.image_url ?? '';

      await sql`
        INSERT INTO users (id, email, name, avatar_url)
        VALUES (${id}, ${email}, ${name}, ${avatarUrl})
        ON CONFLICT (id) DO UPDATE SET
          email = ${email},
          name = ${name},
          avatar_url = ${avatarUrl}
      `;
    }

    return Response.json({ ok: true });
  } catch (err: unknown) {
    console.error('Webhook error:', err);
    const message = err instanceof Error ? err.message : 'Webhook processing failed';
    return Response.json({ error: message }, { status: 500 });
  }
};
