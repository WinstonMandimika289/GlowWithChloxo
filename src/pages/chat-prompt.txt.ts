// Static copy of the chatbot's system prompt, generated from src/data at build
// time. Used by the optional Cloudflare Worker (worker/groq-proxy.js) when the
// site is deployed to static hosting.

import type { APIRoute } from 'astro';
import { buildSystemPrompt } from '../lib/chatPrompt';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(buildSystemPrompt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
