import { Fragment, useEffect, useRef, type ElementType } from 'react';
import { clamp, prefersReducedMotion, subscribe } from './motion';

/* ======================================================================
   Cursor
   - A small white blob in "difference" blend mode: it inverts whatever is under it.
   - Over big headings it swells into a lens that inverts the letters.
   - Over links and small buttons it wraps the element like a pill and leans with the pointer.
   - Over project cards / the tech sphere it becomes a solid label ("View", "Drag").
   - Buttons with the class "magnetic" are pulled toward the pointer.
   - A soft blue glow drifts after it in the background.
   Only on devices with a real mouse; touch screens keep their normal behaviour.
   ====================================================================== */
type Mode = 'idle' | 'text' | 'snap' | 'big' | 'label';
const TEXT_SEL = 'h1, h2, h3, .split, .finale-words, .marquee, .outro-title';
const LINK_SEL = 'a, button, [role="button"], .stack-groups li';

export function Cursor() {
  const blob = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const tagText = useRef<HTMLSpanElement>(null);
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !matchMedia('(pointer: fine)').matches) return;
    const root = document.documentElement;
    root.classList.add('has-cursor');

    let x = innerWidth / 2, y = innerHeight / 2;
    // current (c*) and target (t*) blob geometry
    let cx = x, cy = y, cw = 14, ch = 14, cr = 7;
    let gx = x, gy = y;
    let tScale = 0, cScale = 0;
    let mode: Mode = 'idle';
    let snapEl: HTMLElement | null = null;
    let magnet: HTMLElement | null = null;
    let shown = false;
    let pressed = false;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        shown = true;
        cx = gx = x;
        cy = gy = y;
        root.classList.add('cursor-on');
      }
      if (magnet) {
        const b = magnet.getBoundingClientRect();
        const pull = Number(magnet.dataset.pull ?? 0.3);
        magnet.style.transform = `translate3d(${(x - (b.left + b.width / 2)) * pull}px,${(y - (b.top + b.height / 2)) * pull}px,0)`;
      }
    };

    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const labelled = t.closest<HTMLElement>('[data-cursor]');
      const link = t.closest<HTMLElement>(LINK_SEL);
      snapEl = null;
      if (labelled) {
        mode = 'label';
        tagText.current!.textContent = labelled.dataset.cursor!;
        tScale = labelled.dataset.cursorSize === 'sm' ? 0.62 : 1;
      } else if (link) {
        const b = link.getBoundingClientRect();
        if (link.classList.contains('magnetic') && b.width > 120) mode = 'big';
        else if (b.width < 420 && b.height < 90) {
          mode = 'snap';
          snapEl = link;
        } else mode = 'big';
      } else if (t.closest(TEXT_SEL)) mode = 'text';
      else mode = 'idle';
      if (mode !== 'label') tScale = 0;
      blob.current!.dataset.mode = mode;

      const m = t.closest<HTMLElement>('.magnetic');
      if (m !== magnet) {
        if (magnet) magnet.style.transform = '';
        magnet = m;
      }
    };

    const onDown = () => (pressed = true);
    const onUp = () => (pressed = false);
    const onLeave = () => {
      shown = false;
      root.classList.remove('cursor-on');
    };

    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerover', onOver, { passive: true });
    addEventListener('pointerdown', onDown);
    addEventListener('pointerup', onUp);
    document.addEventListener('pointerleave', onLeave);

    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

    const off = subscribe(() => {
      if (!shown) return;
      let tx = x, ty = y, tw = 14, th = 14, tr = 7, k = 0.3;
      if (mode === 'text') {
        tw = th = 96;
        tr = 48;
        k = 0.18;
      } else if (mode === 'big') {
        tw = th = 64;
        tr = 32;
        k = 0.2;
      } else if (mode === 'label') {
        tw = th = 8;
        tr = 4;
      } else if (mode === 'snap' && snapEl) {
        const b = snapEl.getBoundingClientRect();
        // Wrap the element, leaning a little toward the pointer.
        tx = b.left + b.width / 2 + (x - (b.left + b.width / 2)) * 0.12;
        ty = b.top + b.height / 2 + (y - (b.top + b.height / 2)) * 0.18;
        tw = b.width + 22;
        th = b.height + 12;
        tr = Math.min(th / 2, 18);
        k = 0.22;
      }
      if (pressed) {
        tw *= 0.82;
        th *= 0.82;
      }
      cx = lerp(cx, tx, k);
      cy = lerp(cy, ty, k);
      cw = lerp(cw, tw, 0.2);
      ch = lerp(ch, th, 0.2);
      cr = lerp(cr, tr, 0.2);
      cScale = lerp(cScale, tScale, 0.2);
      gx = lerp(gx, x, 0.06);
      gy = lerp(gy, y, 0.06);

      const bl = blob.current!.style;
      bl.width = `${cw.toFixed(1)}px`;
      bl.height = `${ch.toFixed(1)}px`;
      bl.borderRadius = `${cr.toFixed(1)}px`;
      bl.transform = `translate3d(${(cx - cw / 2).toFixed(1)}px,${(cy - ch / 2).toFixed(1)}px,0)`;
      tag.current!.style.transform = `translate3d(${x}px,${y}px,0) scale(${cScale.toFixed(3)})`;
      glow.current!.style.transform = `translate3d(${gx}px,${gy}px,0)`;
    }, 10);

    return () => {
      off();
      root.classList.remove('has-cursor', 'cursor-on');
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerover', onOver);
      removeEventListener('pointerdown', onDown);
      removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <>
      <div ref={glow} className="cursor-glow" aria-hidden="true" />
      <div ref={blob} className="cursor-blob" data-mode="idle" aria-hidden="true" />
      <div ref={tag} className="cursor-tag" aria-hidden="true">
        <span ref={tagText} />
      </div>
    </>
  );
}

/* ======================================================================
   Split: headings that rise in word by word when they scroll into view.
   Write lines separated by "|" and wrap accent words in *stars*:
     <Split text="A builder at heart.|A learner, *always.*" />
   ====================================================================== */
export function Split({ text, as: Tag = 'h2', className = '' }: { text: string; as?: ElementType; className?: string }) {
  let n = 0;
  const lines = text.split('|').map(line => {
    // Split into accent / plain segments, then into words.
    const parts = line.split(/(\*[^*]+\*)/).filter(Boolean);
    return parts.flatMap(part => {
      const em = part.startsWith('*') && part.endsWith('*');
      return part
        .replace(/\*/g, '')
        .split(' ')
        .filter(Boolean)
        .map(word => ({ word, em, i: n++ }));
    });
  });

  return (
    <Tag className={`split reveal ${className}`} aria-label={text.replace(/[|*]/g, ' ').replace(/\s+/g, ' ').trim()}>
      {lines.map((words, li) => (
        <span className="split-line" key={li} aria-hidden="true">
          {words.map((w, wi) => (
            <Fragment key={wi}>
              <span className="w">
                <span style={{ ['--i' as string]: w.i }}>{w.em ? <em>{w.word}</em> : w.word}</span>
              </span>
              {wi < words.length - 1 ? ' ' : null}
            </Fragment>
          ))}
        </span>
      ))}
    </Tag>
  );
}

/* ======================================================================
   Marquee: a big band of text that always drifts, speeds up with your scroll,
   flips direction when you scroll back up, and leans a little with the speed.
   ====================================================================== */
export function Marquee({ items, reverse = false, variant = 'solid' }: { items: string[]; reverse?: boolean; variant?: 'solid' | 'outline' }) {
  const band = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = band.current!;
    const tr = track.current!;
    if (prefersReducedMotion()) return;

    let half = 1;
    let pos = 0;
    let dir = reverse ? 1 : -1;
    let lastY = scrollY;
    let lastT = 0;
    let skew = 0;
    let visible = false;

    const measure = () => (half = tr.scrollWidth / 2 || 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(tr);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '10% 0px' });
    io.observe(el);

    const off = subscribe(t => {
      const dt = lastT ? Math.min(64, t - lastT) : 16;
      lastT = t;
      const v = scrollY - lastY;
      lastY = scrollY;
      if (!visible) return;
      if (Math.abs(v) > 0.5) dir = (v > 0 ? -1 : 1) * (reverse ? -1 : 1);
      const speed = 0.045 + Math.min(Math.abs(v), 80) * 0.012; // px per ms
      pos += dir * speed * dt;
      if (pos <= -half) pos += half;
      if (pos > 0) pos -= half;
      skew += (clamp(v * 0.18, -7, 7) - skew) * 0.12;
      tr.style.transform = `translate3d(${pos.toFixed(2)}px,0,0) skewX(${(-skew).toFixed(2)}deg)`;
    });

    return () => {
      off();
      ro.disconnect();
      io.disconnect();
    };
  }, [reverse]);

  // Two identical copies so the loop is seamless; each copy repeats the list twice to fill wide screens.
  const copy = [...items, ...items];
  return (
    <div className={`marquee marquee-${variant}`} ref={band} aria-hidden="true">
      <div className="marquee-track" ref={track}>
        {[0, 1].map(k => (
          <div className="marquee-copy" key={k}>
            {copy.map((t, i) => (
              <span key={i}>
                {t}
                <i>✦</i>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
