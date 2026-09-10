// Server-only helpers for talking to Groq. Never import this from client code.

import { CHAT } from './chatConfig';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export class GroqError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

/** Validates and trims client-supplied history. Returns null if unusable. */
export function sanitizeMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) return null;
  const messages = input
    .filter(
      (m): m is ChatMessage =>
        !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
    )
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, m.role === 'user' ? CHAT.maxInputChars : CHAT.maxAssistantChars).trim(),
    }))
    .filter((m) => m.content)
    .slice(-CHAT.maxHistory);
  if (!messages.length || messages[messages.length - 1].role !== 'user') return null;
  return messages;
}

function requestBody(model: string, system: string, messages: ChatMessage[]) {
  return JSON.stringify({
    model,
    messages: [{ role: 'system', content: system }, ...messages],
    temperature: CHAT.temperature,
    max_completion_tokens: CHAT.maxCompletionTokens,
    stream: true,
    // gpt-oss keeps its reasoning out of `content`; don't return it at all.
    ...(model.startsWith('openai/gpt-oss') ? { include_reasoning: false, reasoning_effort: 'low' } : {}),
  });
}

/** Statuses where trying the fallback model might succeed. */
const RETRYABLE = new Set([404, 413, 429, 498, 500, 502, 503]);

/**
 * Opens a streamed completion, falling back to the secondary model on
 * rate-limit / capacity / model errors. Resolves with the upstream Response.
 */
export async function openGroqStream(opts: {
  apiKey: string;
  models: string[];
  system: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
}): Promise<Response> {
  let last: GroqError | undefined;
  for (const model of opts.models) {
    const res = await fetch(CHAT.groqUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json' },
      body: requestBody(model, opts.system, opts.messages),
      signal: opts.signal,
    });
    if (res.ok && res.body) return res;
    const detail = await res.text().catch(() => '');
    last = new GroqError(res.status, detail.slice(0, 300), Number(res.headers.get('retry-after')) || undefined);
    if (!RETRYABLE.has(res.status)) break;
  }
  throw last ?? new GroqError(500, 'No model available');
}

/** Converts Groq's SSE stream into a plain UTF-8 stream of reply text. */
export function sseToText(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  const handle = (line: string, controller: TransformStreamDefaultController<Uint8Array>) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return;
    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') return;
    try {
      const json = JSON.parse(data);
      const text = json.choices?.[0]?.delta?.content;
      if (text) controller.enqueue(encoder.encode(text));
      if (json.x_groq?.error) controller.error(new Error(String(json.x_groq.error)));
    } catch {
      /* ignore keep-alives / partial JSON */
    }
  };

  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) handle(line, controller);
      },
      flush(controller) {
        if (buffer) handle(buffer, controller);
      },
    }),
  );
}

/** Minimal in-memory sliding-window rate limiter (per server process). */
const hits = new Map<string, number[]>();
export function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < CHAT.rateLimit.windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > CHAT.rateLimit.max;
}
