// Page interactions: header, mobile menu, treatment filters, review carousel
// and the contact form. Re-initialised on every page load.

import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from './motion';
import { site } from '../data/site';

gsap.registerPlugin(Flip, ScrollTrigger);

let cleanups: Array<() => void> = [];

function on(target: EventTarget, type: string, fn: EventListener, opts?: AddEventListenerOptions) {
  target.addEventListener(type, fn, opts);
  cleanups.push(() => target.removeEventListener(type, fn, opts));
}
const motionOK = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initUI() {
  header();
  mobileMenu();
  filters();
  carousels();
  contactForms();
}

export function destroyUI() {
  cleanups.forEach((fn) => fn());
  cleanups = [];
}

// ------------------------------------------------------------------ header

function header() {
  const el = document.querySelector<HTMLElement>('[data-header]');
  if (!el) return;
  let lastY = window.scrollY;
  let frame = 0;
  const update = () => {
    frame = 0;
    const y = window.scrollY;
    const dy = y - lastY;
    el.classList.toggle('is-scrolled', y > 24);
    const menuOpen = document.documentElement.classList.contains('menu-open');
    if (menuOpen || y < 160 || el.contains(document.activeElement)) el.classList.remove('is-hidden');
    else if (dy > 6) el.classList.add('is-hidden');
    else if (dy < -6) el.classList.remove('is-hidden');
    if (Math.abs(dy) > 6) lastY = y;
  };
  on(window, 'scroll', () => {
    if (!frame) frame = requestAnimationFrame(update);
  }, { passive: true });
  on(el, 'focusin', () => el.classList.remove('is-hidden'));
  update();
}

// ------------------------------------------------------------------ mobile menu

function mobileMenu() {
  const btn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-mobile-menu]');
  if (!btn || !menu) return;
  const label = btn.querySelector('[data-menu-label]');
  const root = document.documentElement;
  let closeTimer = 0;

  const isOpen = () => btn.getAttribute('aria-expanded') === 'true';
  const focusables = () => [btn, ...menu.querySelectorAll<HTMLElement>('a, button')];

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    const list = focusables();
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  function open() {
    clearTimeout(closeTimer);
    menu!.hidden = false;
    void menu!.offsetHeight; // commit the hidden → visible change before animating
    menu!.classList.add('is-open');
    btn!.setAttribute('aria-expanded', 'true');
    if (label) label.textContent = 'Close menu';
    root.classList.add('menu-open');
    getLenis()?.stop();
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    setTimeout(() => menu!.querySelector('a')?.focus({ preventScroll: true }), 250);
  }

  function close(restoreFocus = true) {
    if (!isOpen()) return;
    menu!.classList.remove('is-open');
    btn!.setAttribute('aria-expanded', 'false');
    if (label) label.textContent = 'Open menu';
    root.classList.remove('menu-open');
    getLenis()?.start();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    closeTimer = window.setTimeout(() => {
      menu!.hidden = true;
    }, 760);
    if (restoreFocus) btn!.focus({ preventScroll: true });
  }

  on(btn, 'click', () => (isOpen() ? close() : open()));
  on(menu, 'click', (e) => {
    if ((e.target as HTMLElement).closest('a')) close(false);
  });
  on(window, 'resize', () => {
    if (window.innerWidth > 980) close(false);
  });
  cleanups.push(() => {
    close(false);
    clearTimeout(closeTimer);
    document.removeEventListener('keydown', onKey);
  });
}

// ------------------------------------------------------------------ filters

function filters() {
  document.querySelectorAll<HTMLElement>('[data-filter-group]').forEach((group) => {
    const grid = document.querySelector<HTMLElement>(group.dataset.filterGroup ?? '');
    if (!grid) return;
    const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>('[data-filter]'));
    const items = Array.from(grid.querySelectorAll<HTMLElement>('[data-filter-item]'));
    const status = group.querySelector<HTMLElement>('[data-filter-status]');

    const apply = (key: string) => {
      let shown = 0;
      items.forEach((item) => {
        const tags = item.querySelector<HTMLElement>('[data-tags]')?.dataset.tags?.split(' ') ?? [];
        const show = key === 'all' || tags.includes(key);
        item.hidden = !show;
        if (show) shown++;
      });
      if (status) status.textContent = `${shown} ${shown === 1 ? 'treatment' : 'treatments'}`;
    };

    buttons.forEach((button) =>
      on(button, 'click', () => {
        if (button.getAttribute('aria-pressed') === 'true') return;
        buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        const key = button.dataset.filter ?? 'all';
        if (!motionOK()) {
          apply(key);
          ScrollTrigger.refresh();
          return;
        }
        const state = Flip.getState(items, { props: 'opacity' });
        apply(key);
        Flip.from(state, {
          duration: 0.75,
          ease: 'expo.out',
          absolute: true,
          scale: true,
          stagger: 0.03,
          onEnter: (els) =>
            gsap.fromTo(els, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.6, delay: 0.15, ease: 'expo.out' }),
          onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.92, duration: 0.35 }),
          onComplete: () => ScrollTrigger.refresh(),
        });
      }),
    );
  });
}

// ------------------------------------------------------------------ carousel

function carousels() {
  document.querySelectorAll<HTMLElement>('[data-carousel]').forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll<HTMLElement>('[data-slide]'));
    const dots = Array.from(carousel.querySelectorAll<HTMLButtonElement>('[data-dot]'));
    if (slides.length < 2) return;
    const interval = Number(carousel.dataset.interval || 6500);
    carousel.style.setProperty('--carousel-interval', `${interval}ms`);
    let index = 0;
    let timer = 0;
    let visible = false;
    let hovering = false;

    const go = (n: number) => {
      index = (n + slides.length) % slides.length;
      slides.forEach((s, i) => {
        s.classList.toggle('is-active', i === index);
        if (i === index) s.removeAttribute('aria-hidden');
        else s.setAttribute('aria-hidden', 'true');
      });
      dots.forEach((d, i) => {
        d.classList.remove('is-active');
        d.removeAttribute('aria-current');
        if (i === index) {
          void d.offsetWidth; // restart the progress bar
          d.classList.add('is-active');
          d.setAttribute('aria-current', 'true');
        }
      });
    };
    const stop = () => window.clearInterval(timer);
    const play = () => {
      stop();
      if (!motionOK() || !visible || hovering) {
        carousel.classList.add('is-paused');
        return;
      }
      carousel.classList.remove('is-paused');
      go(index);
      timer = window.setInterval(() => go(index + 1), interval);
    };

    carousel.querySelector('[data-prev]')?.addEventListener('click', () => (go(index - 1), play()));
    carousel.querySelector('[data-next]')?.addEventListener('click', () => (go(index + 1), play()));
    dots.forEach((d, i) => d.addEventListener('click', () => (go(i), play())));
    on(carousel, 'pointerenter', () => ((hovering = true), play()));
    on(carousel, 'pointerleave', () => ((hovering = false), play()));
    on(carousel, 'focusin', () => ((hovering = true), play()));
    on(carousel, 'focusout', () => ((hovering = false), play()));

    let startX = 0;
    on(carousel, 'pointerdown', (e) => (startX = (e as PointerEvent).clientX));
    on(carousel, 'pointerup', (e) => {
      const dx = (e as PointerEvent).clientX - startX;
      if (Math.abs(dx) > 50) {
        go(index + (dx < 0 ? 1 : -1));
        play();
      }
    });

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      play();
    });
    io.observe(carousel);
    cleanups.push(() => {
      stop();
      io.disconnect();
    });
  });
}

// ------------------------------------------------------------------ contact form

function contactForms() {
  document.querySelectorAll<HTMLFormElement>('[data-contact-form]').forEach((form) => {
    const status = form.querySelector<HTMLElement>('[data-form-status]');
    const label = form.querySelector<HTMLElement>('[data-submit-label]');
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    on(form, 'submit', async (e) => {
      e.preventDefault();
      if (!form.reportValidity() || !status || !button) return;
      button.disabled = true;
      if (label) label.textContent = 'Sending…';
      status.textContent = '';
      status.removeAttribute('data-state');
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(data.message || `HTTP ${res.status}`);
        form.reset();
        status.dataset.state = 'ok';
        status.textContent = 'Thank you! Your message is on its way — Chlo will be in touch soon.';
      } catch {
        status.dataset.state = 'error';
        status.textContent = `Sorry, that didn’t send. Please try again, or email ${site.email}.`;
      } finally {
        button.disabled = false;
        if (label) label.textContent = 'Send message';
      }
    });
  });
}
