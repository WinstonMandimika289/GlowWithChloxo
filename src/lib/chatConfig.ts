// Chat settings shared by the server proxy and the widget (no secrets here).

export const CHAT = {
  groqUrl: 'https://api.groq.com/openai/v1/chat/completions',
  /** Production Groq models (Sept 2026). Llama 3.x was retired for free/dev tiers. */
  defaultModel: 'openai/gpt-oss-120b',
  fallbackModel: 'openai/gpt-oss-20b',
  temperature: 0.5,
  /** gpt-oss counts its (hidden) reasoning against this, so keep headroom. */
  maxCompletionTokens: 700,
  maxHistory: 10,
  maxInputChars: 600,
  maxAssistantChars: 1500,
  rateLimit: { windowMs: 10 * 60_000, max: 20 },
  timeoutMs: 25_000,
} as const;
