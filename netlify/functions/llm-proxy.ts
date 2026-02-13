/**
 * LLM Proxy — streams OpenRouter requests server-side so the API key
 * never reaches the client. The client sends the same OpenAI-compatible
 * body it would send directly; this function injects the real auth header
 * and pipes the SSE stream back.
 */

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  if (!OPENROUTER_KEY) {
    return Response.json(
      { error: 'LLM proxy not configured — missing OPENROUTER_API_KEY' },
      { status: 500 },
    );
  }

  let body: string;
  try {
    body = await req.text();
  } catch {
    return Response.json({ error: 'Failed to read request body' }, { status: 400 });
  }

  // Determine if the client wants streaming
  let isStreaming = false;
  try {
    const parsed = JSON.parse(body);
    isStreaming = parsed.stream === true;
  } catch {
    // body might not be valid JSON, pass it through anyway
  }

  try {
    const upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://appforge-builder.netlify.app',
        'X-Title': 'AppForge',
      },
      body,
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return new Response(errText, {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (isStreaming && upstream.body) {
      // Stream the SSE response back to the client
      return new Response(upstream.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // Non-streaming: return JSON as-is
    const data = await upstream.text();
    return new Response(data, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    return Response.json({ error: message }, { status: 502 });
  }
};
