// Scroll & interaction animation: Lenis smooth scroll + GSAP (ScrollTrigger, SplitText).
// Everything is skipped for prefers-reduced-motion, and fully reverted before
// each Astro view transition so nothing leaks between pages.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger, SplitText);

declare global {
  interface Window {
    __gwcMotion?: boolean;
  }
}

let lenis: Lenis | null = null;
let mm: gsap.MatchMedia | null = null;
let cleanups: Array<() => void> = [];
let introDelay = 0;
let preloaderPlayed = false;

const tick = (time: number) => lenis?.raf(time * 1000);
export const getLenis = () => lenis;

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));
const inViewAtLoad = (el: Element) => el.getBoundingClientRect().top < window.innerHeight * 0.92;

export function initMotion() {
  window.__gwcMotion = true;
  const root = document.documentElement;
  if (prefersReduced()) {
    root.classList.remove('motion', 'first-visit');
    return;
  }
  root.classList.add('motion');

  lenis = new Lenis({ lerp: 0.11, smoothWheel: true, anchors: { offset: -90 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899.98px)' }, (ctx) => {
    const { desktop } = ctx.conditions as { desktop: boolean };
    introDelay = preloader();
    splitHeadings();
    reveals();
    clips();
    parallax(desktop ? 1 : 0.5);
    counters();
    scrubText();
    drawLines();
    const undoH = desktop ? horizontalScroll() : undefined;
    introDelay = 0;
    return () => undoH?.();
  });

  if (finePointer()) {
    magnetic();
    tilt();
  }
  marqueeVelocity();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

export function destroyMotion() {
  mm?.revert();
  mm = null;
  cleanups.forEach((fn) => fn());
  cleanups = [];
  gsap.ticker.remove(tick);
  lenis?.destroy();
  lenis = null;
}

// ------------------------------------------------------------------ pieces

/** Plays the first-visit preloader; returns the delay before intro animations. */
function preloader(): number {
  const root = document.documentElement;
  const el = document.querySelector<HTMLElement>('[data-preloader]');
  if (preloaderPlayed || !el || !root.classList.contains('first-visit')) {
    root.classList.remove('first-visit');
    return 0;
  }
  preloaderPlayed = true;
  el.style.animation = 'none';
  lenis?.stop();
  gsap
    .timeline({
      delay: 1.15,
      onComplete: () => {
        root.classList.remove('first-visit');
        el.removeAttribute('style');
        lenis?.start();
      },
    })
    .to(el.querySelector('.preloader__inner'), { autoAlpha: 0, y: -24, duration: 0.5, ease: 'power2.in' })
    .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' }, '-=0.15');
  return 1.6;
}

function splitHeadings() {
  $$('[data-split]').forEach((el) => {
    const delay = inViewAtLoad(el) ? introDelay + 0.05 : 0;
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      linesClass: 'split-line',
      onSplit(self) {
        gsap.set(el, { visibility: 'visible' });
        return gsap.from(self.lines, {
          yPercent: 115,
          duration: 1.25,
          ease: 'expo.out',
          stagger: 0.1,
          delay,
          scrollTrigger: delay ? undefined : { trigger: el, start: 'top 88%', once: true },
        });
      },
    });
  });
}

function reveals() {
  let k = 0;
  $$('[data-reveal]').forEach((el) => {
    const d = inViewAtLoad(el) ? introDelay + 0.3 + k++ * 0.08 : 0;
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: 26 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        ease: 'expo.out',
        delay: d,
        clearProps: 'transform',
        scrollTrigger: d ? undefined : { trigger: el, start: 'top 92%', once: true },
      },
    );
  });
  $$('[data-reveal-stagger]').forEach((group) => {
    const d = inViewAtLoad(group) ? introDelay + 0.35 : 0;
    gsap.fromTo(
      Array.from(group.children),
      { autoAlpha: 0, y: 34 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.08,
        delay: d,
        clearProps: 'transform',
        scrollTrigger: d ? undefined : { trigger: group, start: 'top 90%', once: true },
      },
    );
  });
}

function clips() {
  let k = 0;
  $$('[data-clip]').forEach((el) => {
    const inView = inViewAtLoad(el);
    const delay = inView ? introDelay + 0.1 + k++ * 0.14 : 0;
    const trigger = () => (inView ? undefined : { trigger: el, start: 'top 88%', once: true });
    gsap.fromTo(
      el,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', delay, scrollTrigger: trigger() },
    );
    const media = el.querySelector('img');
    if (media) {
      gsap.fromTo(
        media,
        { scale: 1.3 },
        { scale: 1, duration: 2, ease: 'expo.out', delay, clearProps: 'transform', scrollTrigger: trigger() },
      );
    }
  });
}

function parallax(factor: number) {
  $$('[data-parallax]').forEach((el) => {
    const amount = parseFloat(el.dataset.parallax || '8') * factor;
    gsap.fromTo(
      el,
      { yPercent: -amount },
      {
        yPercent: amount,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}

function counters() {
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const suffix = el.dataset.suffix ?? '';
    const state = { v: 0 };
    el.textContent = `0${suffix}`;
    gsap.to(state, {
      v: end,
      duration: 2.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      onUpdate: () => {
        el.textContent = `${Math.round(state.v)}${suffix}`;
      },
    });
  });
}

function scrubText() {
  $$('[data-scrub-text]').forEach((el) => {
    const split = SplitText.create(el, { type: 'words' });
    gsap.fromTo(
      split.words,
      { opacity: 0.16 },
      {
        opacity: 1,
        ease: 'none',
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: true },
      },
    );
  });
}

function drawLines() {
  $$('[data-draw]').forEach((el) => {
    gsap.fromTo(
      el,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        transformOrigin: 'top center',
        scrollTrigger: { trigger: el.parentElement ?? el, start: 'top 70%', end: 'bottom 70%', scrub: true },
      },
    );
  });
}

/** Pins a section and scrolls its track sideways (desktop only). */
function horizontalScroll() {
  const sections = $$('[data-hscroll]');
  sections.forEach((section) => {
    const track = section.querySelector<HTMLElement>('[data-hscroll-track]');
    if (!track) return;
    section.classList.add('is-hscroll');
    const distance = () => Math.max(0, track.scrollWidth - section.clientWidth);
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
  });
  return () => sections.forEach((s) => s.classList.remove('is-hscroll'));
}

/** Marquees speed up with scroll velocity, then ease back. */
function marqueeVelocity() {
  const anims = $$('[data-marquee] .marquee__track').flatMap((t) => t.getAnimations());
  if (!anims.length) return;
  let rate = 1;
  const update = () => {
    const target = 1 + Math.min(Math.abs(lenis?.velocity ?? 0) * 0.12, 4);
    rate += (target - rate) * 0.08;
    for (const a of anims) a.playbackRate = rate;
  };
  gsap.ticker.add(update);
  cleanups.push(() => gsap.ticker.remove(update));
}

function magnetic() {
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.36);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    cleanups.push(() => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: 'transform' });
    });
  });
}

function tilt() {
  $$('[data-tilt]').forEach((card) => {
    const target = card.querySelector<HTMLElement>('.service-card__media') ?? card;
    gsap.set(target, { transformPerspective: 900 });
    const rx = gsap.quickTo(target, 'rotationX', { duration: 0.7, ease: 'power3' });
    const ry = gsap.quickTo(target, 'rotationY', { duration: 0.7, ease: 'power3' });
    const move = (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 7);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 7);
    };
    const leave = () => {
      rx(0);
      ry(0);
    };
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', leave);
    cleanups.push(() => {
      card.removeEventListener('pointermove', move);
      card.removeEventListener('pointerleave', leave);
      gsap.killTweensOf(target);
    });
  });
}
