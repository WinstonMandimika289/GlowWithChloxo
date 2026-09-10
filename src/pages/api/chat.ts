// POST /api/chat — server-side proxy to Groq. The API key never reaches the browser.
// Responds with a text/plain stream of the reply, or JSON { fallback: true } so the
// widget answers from its built-in knowledge instead.

import type { APIRoute } from 'astro';
import { GROQ_API_KEY, GROQ_MODEL } from 'astro:env/server';
import { CHAT } from '../../lib/chatConfig';
import { buildSystemPrompt } from '../../lib/chatPrompt';
import { GroqError, openGroqStream, rateLimited, sanitizeMessages, sseToText } from '../../lib/groq';

export const prerender = false;

const SYSTEM_PROMPT = buildSystemPrompt();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!GROQ_API_KEY) return json({ fallback: true, reason: 'not-configured' });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const messages = sanitizeMessages((payload as { messages?: unknown })?.messages);
  if (!messages) return json({ error: 'Invalid messages' }, 400);

  if (rateLimited(clientAddress || 'unknown')) return json({ fallback: true, reason: 'rate-limited' });

  const models = [...new Set([GROQ_MODEL || CHAT.defaultModel, CHAT.fallbackModel])];
  try {
    const upstream = await openGroqStream({
      apiKey: GROQ_API_KEY,
      models,
      system: SYSTEM_PROMPT,
      messages,
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(CHAT.timeoutMs)]),
    });
    return new Response(sseToText(upstream.body!), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    const status = err instanceof GroqError ? err.status : 0;
    console.warn(`[chat] Groq unavailable (${status || (err as Error).name}) ${err instanceof GroqError ? err.message : ''}`);
    return json({
      fallback: true,
      reason: status === 429 ? 'rate-limited' : status === 401 ? 'bad-key' : 'unavailable',
    });
  }
};
