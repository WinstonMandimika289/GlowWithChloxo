/**
 * Cloudflare Worker — Groq proxy for the Glow With Chlo chat widget, for when the
 * site is deployed to static hosting (e.g. GitHub Pages) and /api/chat doesn't exist.
 *
 * Deploy:
 *   npx wrangler deploy worker/groq-proxy.js --name glow-chat --compatibility-date 2026-09-01
 *   npx wrangler secret put GROQ_API_KEY --name glow-chat
 * Variables (dashboard or wrangler.toml):
 *   SITE_URL        https://glow-with-chlo.com   — the worker reads /chat-prompt.txt from here
 *   ALLOWED_ORIGIN  https://glow-with-chlo.com   — only this origin may call the worker
 *   GROQ_MODEL      optional override (default openai/gpt-oss-120b)
 * Then build the site with PUBLIC_CHAT_ENDPOINT=https://glow-chat.<account>.workers.dev
 * Tip: add a Cloudflare rate-limiting rule on the worker route to cap abuse.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'openai/gpt-oss-20b';
const MAX_HISTORY = 10;
const MAX_INPUT = 600;
const MAX_ASSISTANT = 1500;
const RETRYABLE = new Set([404, 413, 429, 498, 500, 502, 503]);

let cachedPrompt = { text: '', at: 0 };

async function getPrompt(env) {
  if (cachedPrompt.text && Date.now() - cachedPrompt.at < 60 * 60 * 1000) return cachedPrompt.text;
  const res = await fetch(new URL('/chat-prompt.txt', env.SITE_URL));
  if (!res.ok) return cachedPrompt.text;
  cachedPrompt = { text: await res.text(), at: Date.now() };
  return cachedPrompt.text;
}

function sanitize(input) {
  if (!Array.isArray(input)) return null;
  const messages = input
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, m.role === 'user' ? MAX_INPUT : MAX_ASSISTANT).trim() }))
    .filter((m) => m.content)
    .slice(-MAX_HISTORY);
  return messages.length && messages[messages.length - 1].role === 'user' ? messages : null;
}

function sseToText() {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  const handle = (line, controller) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return;
    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') return;
    try {
      const text = JSON.parse(data).choices?.[0]?.delta?.content;
      if (text) controller.enqueue(encoder.encode(text));
    } catch {
      /* ignore partial lines */
    }
  };
  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) handle(line, controller);
    },
    flush(controller) {
      if (buffer) handle(buffer, controller);
    },
  });
}

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || env.SITE_URL;
    const cors = {
      'Access-Control-Allow-Origin': allowed,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    };
    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    const origin = request.headers.get('Origin');
    if (origin && origin !== allowed) return json({ error: 'Forbidden' }, 403);
    if (!env.GROQ_API_KEY) return json({ fallback: true, reason: 'not-configured' });

    let messages;
    try {
      messages = sanitize((await request.json()).messages);
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }
    if (!messages) return json({ error: 'Invalid messages' }, 400);

    const system = await getPrompt(env);
    if (!system) return json({ fallback: true, reason: 'unavailable' });

    let reason = 'unavailable';
    for (const model of [...new Set([env.GROQ_MODEL || DEFAULT_MODEL, FALLBACK_MODEL])]) {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: system }, ...messages],
          temperature: 0.5,
          max_completion_tokens: 700,
          stream: true,
          ...(model.startsWith('openai/gpt-oss') ? { include_reasoning: false, reasoning_effort: 'low' } : {}),
        }),
      });
      if (res.ok && res.body) {
        return new Response(res.body.pipeThrough(sseToText()), {
          headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
        });
      }
      reason = res.status === 429 ? 'rate-limited' : res.status === 401 ? 'bad-key' : 'unavailable';
      if (!RETRYABLE.has(res.status)) break;
    }
    return json({ fallback: true, reason });
  },
};
