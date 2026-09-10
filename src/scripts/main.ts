import { initMotion, destroyMotion } from './motion';
import { initUI, destroyUI } from './ui';
import { initChat } from './chat';

// The chat widget is persisted across view transitions, so it initialises once.
initChat();

// Page-level behaviour is (re)initialised on every navigation and torn down
// before the old page is swapped out, so ScrollTriggers/listeners never leak.
document.addEventListener('astro:page-load', () => {
  initUI();
  initMotion();
});
document.addEventListener('astro:before-swap', () => {
  destroyUI();
  destroyMotion();
});
