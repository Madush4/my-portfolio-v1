import Lenis from 'lenis';

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Ease in and out: 0 -> 1 with a soft start and a soft finish. */
export const smooth = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * One requestAnimationFrame loop for the whole page.
 * Smooth scrolling, the scroll animations, the timeline and the dust all share it,
 * so the browser does the work once per frame instead of several times.
 * Lower `order` runs first (smooth scroll goes first so everything else reads the fresh position).
 */
type Tick = (time: number) => void;
const subscribers: { fn: Tick; order: number }[] = [];
let raf = 0;

function loop(time: number) {
  for (const s of subscribers.slice()) s.fn(time);
  raf = requestAnimationFrame(loop);
}

export function subscribe(fn: Tick, order = 0) {
  subscribers.push({ fn, order });
  subscribers.sort((a, b) => a.order - b.order);
  if (!raf) raf = requestAnimationFrame(loop);
  return () => {
    const i = subscribers.findIndex(s => s.fn === fn);
    if (i >= 0) subscribers.splice(i, 1);
    if (!subscribers.length) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

/** Wheel scrolling glides; touch and keyboard stay native. Skipped for reduced motion. */
export function startSmoothScroll() {
  if (prefersReducedMotion()) return () => {};
  const instance = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, anchors: true });
  lenis = instance;
  const off = subscribe(t => instance.raf(t), -100);
  return () => {
    off();
    instance.destroy();
    lenis = null;
  };
}
