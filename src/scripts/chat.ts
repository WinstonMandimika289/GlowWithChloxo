// Chat widget: streams answers from /api/chat (Groq) and falls back to the
// in-browser answer engine whenever the AI isn't configured or available.

import { localReply, starterChips } from '../lib/localBot';
import { renderMarkdown } from '../lib/markdown';
import { CHAT } from '../lib/chatConfig';

type Msg = { role: 'user' | 'assistant'; content: string };

const STORE_KEY = 'gwc-chat-v1';
const TEASER_KEY = 'gwc-chat-teaser';
const ENDPOINT: string = import.meta.env.PUBLIC_CHAT_ENDPOINT || '/api/chat';
const FOLLOW_UPS = ['Book an appointment', 'Price list', 'Which facial suits me?', 'Mobile service?'];

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function load(): Msg[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(-30) : [];
  } catch {
    return [];
  }
}
function save(history: Msg[]) {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-30)));
  } catch {
    /* storage unavailable */
  }
}

export function initChat() {
  const root = document.querySelector<HTMLElement>('[data-chat]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';

  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const launcher = q<HTMLButtonElement>('[data-chat-launcher]');
  const panel = q('[data-chat-panel]');
  const log = q('[data-chat-log]');
  const form = q<HTMLFormElement>('[data-chat-form]');
  const input = q<HTMLTextAreaElement>('[data-chat-input]');
  const chips = q('[data-chat-chips]');
  const modeLabel = q('[data-chat-mode]');
  const teaser = q('[data-chat-teaser]');

  let history = load();
  let busy = false;
  let aiAvailable = true;

  const scrollToEnd = () => {
    log.scrollTop = log.scrollHeight;
  };

  function bubble(role: Msg['role'], html = '') {
    const row = document.createElement('div');
    row.className = `chat-msg chat-msg--${role}`;
    const body = document.createElement('div');
    body.className = 'chat-msg__bubble';
    body.innerHTML = html;
    row.append(body);
    log.append(row);
    scrollToEnd();
    return body;
  }

  function typing() {
    const row = document.createElement('div');
    row.className = 'chat-msg chat-msg--assistant chat-msg--typing';
    row.innerHTML =
      '<div class="chat-msg__bubble" role="status" aria-label="Glow is typing"><span></span><span></span><span></span></div>';
    log.append(row);
    scrollToEnd();
    return row;
  }

  function setChips(list: string[] = []) {
    chips.replaceChildren(
      ...list.slice(0, 4).map((label) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chat-chip';
        b.textContent = label;
        b.addEventListener('click', () => send(label));
        return b;
      }),
    );
  }

  function setMode(mode: 'ai' | 'local') {
    root.dataset.mode = mode;
    modeLabel.textContent = mode === 'ai' ? 'AI assistant · online' : 'Instant answers · online';
  }

  function restore() {
    log.replaceChildren();
    if (!history.length) {
      const hello = localReply('');
      bubble('assistant', renderMarkdown(hello.text));
      setChips(hello.chips);
      return;
    }
    for (const m of history) bubble(m.role, m.role === 'user' ? esc(m.content) : renderMarkdown(m.content));
    setChips(starterChips);
  }

  async function requestAI(): Promise<Response | null> {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-CHAT.maxHistory) }),
        signal: AbortSignal.timeout(CHAT.timeoutMs),
      });
      const type = res.headers.get('content-type') ?? '';
      if (res.ok && res.body && type.startsWith('text/plain')) return res;
      if (type.includes('application/json')) {
        const data = await res.json().catch(() => ({}));
        if (data?.reason === 'not-configured' || data?.reason === 'bad-key') aiAvailable = false;
      } else if (res.status === 404 || res.status === 405) {
        aiAvailable = false; // static hosting without a proxy
      }
    } catch {
      /* network error / timeout → local answer */
    }
    return null;
  }

  async function send(raw: string) {
    const text = raw.trim().slice(0, CHAT.maxInputChars);
    if (!text || busy) return;
    busy = true;
    form.classList.add('is-busy');
    input.value = '';
    autoSize();
    setChips([]);
    hideTeaser();

    bubble('user', esc(text));
    history.push({ role: 'user', content: text });
    save(history);
    const dots = typing();

    let reply = '';
    let nextChips: string[] | undefined;
    let streamBody: HTMLElement | null = null;

    if (aiAvailable) {
      const res = await requestAI();
      if (res?.body) {
        try {
          dots.remove();
          streamBody = bubble('assistant');
          const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
          let frame = 0;
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            reply += value;
            if (!frame) {
              frame = requestAnimationFrame(() => {
                frame = 0;
                streamBody!.innerHTML = renderMarkdown(reply);
                scrollToEnd();
              });
            }
          }
          cancelAnimationFrame(frame);
          streamBody.innerHTML = renderMarkdown(reply);
          scrollToEnd();
        } catch {
          /* stream interrupted — keep whatever arrived */
        }
        if (reply.trim()) setMode('ai');
      }
    }

    if (!reply.trim()) {
      streamBody?.parentElement?.remove();
      const answer = localReply(text);
      await wait(450 + Math.random() * 450);
      dots.remove();
      reply = answer.text;
      nextChips = answer.chips;
      bubble('assistant', renderMarkdown(reply));
      setMode('local');
    }

    history.push({ role: 'assistant', content: reply.slice(0, CHAT.maxAssistantChars) });
    save(history);
    setChips(nextChips ?? FOLLOW_UPS.filter((c) => c.toLowerCase() !== text.toLowerCase()).slice(0, 3));
    busy = false;
    form.classList.remove('is-busy');
    input.focus({ preventScroll: true });
  }

  function autoSize() {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  }

  let closeTimer = 0;
  function open(prefill?: string) {
    clearTimeout(closeTimer);
    panel.hidden = false;
    requestAnimationFrame(() => root.classList.add('is-open'));
    launcher.setAttribute('aria-expanded', 'true');
    hideTeaser();
    if (!log.childElementCount) restore();
    setTimeout(() => input.focus({ preventScroll: true }), 60);
    if (prefill) send(prefill);
  }

  function close() {
    root.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    closeTimer = window.setTimeout(() => {
      panel.hidden = true;
    }, 420);
    launcher.focus({ preventScroll: true });
  }

  function hideTeaser() {
    teaser.hidden = true;
    try {
      sessionStorage.setItem(TEASER_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  launcher.addEventListener('click', () => (root.classList.contains('is-open') ? close() : open()));
  q('[data-chat-close]').addEventListener('click', close);
  q('[data-chat-reset]').addEventListener('click', () => {
    history = [];
    save(history);
    aiAvailable = true;
    restore();
    input.focus();
  });
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    send(input.value);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input.value);
    }
  });
  input.addEventListener('input', autoSize);

  // On small screens the panel is full-screen, so close it when following a site link.
  log.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('a');
    if (a && a.origin === location.origin && window.matchMedia('(max-width: 560px)').matches) close();
  });

  // Any element with [data-chat-open] (optionally [data-chat-ask]) opens the chat.
  document.addEventListener('click', (e) => {
    const trigger = (e.target as HTMLElement).closest<HTMLElement>('[data-chat-open]');
    if (!trigger) return;
    e.preventDefault();
    open(trigger.dataset.chatAsk);
  });

  q('[data-chat-teaser-open]').addEventListener('click', () => open());
  q('[data-chat-teaser-close]').addEventListener('click', hideTeaser);
  try {
    if (!sessionStorage.getItem(TEASER_KEY)) {
      setTimeout(() => {
        if (!root.classList.contains('is-open')) teaser.hidden = false;
      }, 9000);
    }
  } catch {
    /* ignore */
  }
}
