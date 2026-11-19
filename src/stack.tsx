import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { stack } from './data';
import { prefersReducedMotion, subscribe } from './motion';

/* ======================================================================
   Tech stack: a slowly turning 3D sphere of technologies next to a list of groups.
   - Hover (or tap) a group and its words light up on the sphere; the rest dim.
   - Hover a word on the sphere and its group lights up in the list.
   - Drag the sphere to spin it; it keeps some momentum, then settles back.
   Drawn on a canvas with plain 2D maths, so it stays light.
   ====================================================================== */

type Word = { text: string; group: number; x: number; y: number; z: number; sx: number; sy: number; depth: number };

export function Stack() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const activeRef = useRef<number | null>(null);
  const hoverRef = useRef<number | null>(null);
  activeRef.current = active;

  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    const reduce = prefersReducedMotion();
    const words: Word[] = [];
    stack.forEach((g, gi) => g.items.forEach(text => words.push({ text, group: gi, x: 0, y: 0, z: 0, sx: 0, sy: 0, depth: 0 })));

    // Spread the words evenly on a sphere (Fibonacci lattice).
    const n = words.length;
    words.forEach((w, i) => {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = i * Math.PI * (3 - Math.sqrt(5));
      w.x = Math.cos(t) * r;
      w.y = y;
      w.z = Math.sin(t) * r;
    });

    let W = 0, H = 0, R = 0, dpr = 1;
    let rx = 0.35, ry = 0;
    let vx = 0, vy = reduce ? 0 : 0.0035;
    let drag: { x: number; y: number } | null = null;
    let px = -1, py = -1;
    let visible = false;
    let fontFamily = 'Inter Tight';

    const resize = () => {
      const b = c.getBoundingClientRect();
      W = b.width;
      H = b.height;
      dpr = Math.min(devicePixelRatio, 2);
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(W, H) * 0.4;
      fontFamily = getComputedStyle(c).fontFamily || fontFamily;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(c);

    const toLocal = (e: PointerEvent) => {
      const b = c.getBoundingClientRect();
      return { x: e.clientX - b.left, y: e.clientY - b.top };
    };
    const down = (e: PointerEvent) => {
      drag = toLocal(e);
      c.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const p = toLocal(e);
      px = p.x;
      py = p.y;
      if (drag) {
        vy = (p.x - drag.x) * 0.0016;
        vx = -(p.y - drag.y) * 0.0016;
        drag = p;
      }
    };
    const up = () => (drag = null);
    const leave = () => {
      px = py = -1;
      if (hoverRef.current !== null) {
        hoverRef.current = null;
        setActive(null);
      }
    };
    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('pointerleave', leave);

    const hex = (h: string, a: number) => {
      const v = parseInt(h.slice(1), 16);
      return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a.toFixed(3)})`;
    };

    const draw = () => {
      // Momentum eases back to a gentle idle spin.
      if (!drag) {
        vx += (0 - vx) * 0.04;
        vy += ((reduce ? 0 : 0.0035) - vy) * 0.04;
      }
      rx += vx;
      ry += vy;
      const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);

      for (const w of words) {
        // rotate around Y, then X
        const x1 = w.x * cy + w.z * sy;
        const z1 = -w.x * sy + w.z * cy;
        const y2 = w.y * cx - z1 * sx;
        const z2 = w.y * sx + z1 * cx;
        const persp = 1.6 / (2.4 - z2);
        w.sx = W / 2 + x1 * R * persp;
        w.sy = H / 2 + y2 * R * persp;
        w.depth = (z2 + 1) / 2; // 0 back, 1 front
      }
      words.sort((a, b) => a.depth - b.depth);

      // Which word is under the pointer (front-most wins)?
      let hovered: Word | null = null;
      if (px >= 0 && !drag) {
        for (let i = words.length - 1; i >= 0; i--) {
          const w = words[i];
          if (w.depth > 0.35 && Math.abs(px - w.sx) < 46 && Math.abs(py - w.sy) < 13) {
            hovered = w;
            break;
          }
        }
        const g = hovered ? hovered.group : null;
        if (g !== hoverRef.current) {
          hoverRef.current = g;
          setActive(g);
        }
      }
      c.style.cursor = hovered ? 'pointer' : 'grab';

      ctx.clearRect(0, 0, W, H);
      // Faint orbit rings
      ctx.strokeStyle = 'rgba(143,184,255,0.07)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2, R * 1.12, R * 1.12 * Math.abs(Math.cos(rx)) + 0.01, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, R * 1.12, 0, Math.PI * 2);
      ctx.stroke();

      const act = activeRef.current;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const w of words) {
        const g = stack[w.group];
        const on = act === null || act === w.group;
        const size = (13 + w.depth * 16) * (act === w.group ? 1.18 : 1) * Math.min(1, Math.max(0.62, R / 210));
        const alpha = on ? 0.28 + w.depth * 0.72 : 0.05 + w.depth * 0.08;
        ctx.font = `${w.depth > 0.6 ? 600 : 500} ${size.toFixed(1)}px ${fontFamily}`;
        if (on && w.depth > 0.55) {
          ctx.shadowColor = hex(g.color, 0.7);
          ctx.shadowBlur = act === w.group ? 18 : 8;
        } else ctx.shadowBlur = 0;
        ctx.fillStyle = act === null ? hex(w.depth > 0.5 ? '#ffffff' : g.color, alpha) : hex(on ? g.color : '#ffffff', alpha);
        ctx.fillText(w.text, w.sx, w.sy);
        if (on && w.depth > 0.7) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = hex(g.color, alpha);
          ctx.beginPath();
          ctx.arc(w.sx, w.sy + size * 0.85, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
    };

    draw();
    const off = subscribe(() => {
      if (visible) draw();
    });

    return () => {
      off();
      ro.disconnect();
      io.disconnect();
      c.removeEventListener('pointerdown', down);
      c.removeEventListener('pointermove', move);
      c.removeEventListener('pointerup', up);
      c.removeEventListener('pointercancel', up);
      c.removeEventListener('pointerleave', leave);
    };
  }, []);

  return (
    <div className="stack">
      <ul className="stack-groups">
        {stack.map((g, i) => (
          <li
            key={g.name}
            className={active === i ? 'is-on' : active !== null ? 'is-dim' : ''}
            style={{ ['--c' as string]: g.color } as CSSProperties}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            onClick={() => setActive(active === i ? null : i)}
          >
            <div className="stack-row">
              <span className="stack-idx">{String(i + 1).padStart(2, '0')}</span>
              <h3>{g.name}</h3>
              <span className="stack-n">{g.items.length}</span>
            </div>
            <div className="stack-items">
              {g.items.map(t => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="stack-sphere">
        <canvas ref={canvas} className="sphere" data-cursor="Drag" data-cursor-size="sm" aria-label="Rotating sphere of technologies I use" role="img" />
        <small>Drag to spin · hover a word</small>
      </div>
    </div>
  );
}
