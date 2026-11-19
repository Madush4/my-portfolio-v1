import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import '@fontsource/inter-tight/latin-400.css';
import '@fontsource/inter-tight/latin-500.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import 'lenis/dist/lenis.css';
import './style.css';
import './modern.css';
import './polish.css';
import { profile, projects, marquees } from './data';
import { Timeline } from './timeline';
import { Stack } from './stack';
import { frameUrl, loadOrder, coarseCount, sequences, type SeqKey } from './sequences';
import { Cursor, Marquee, Split } from './fx';
import { Projects, CaseStudy } from './projects';
import { Finale } from './finale';
import { clamp, smooth, prefersReducedMotion, subscribe, startSmoothScroll, getLenis } from './motion';

/**
 * Frames are kept as decoded <img> elements. The browser manages their memory,
 * which matters with ~200 full-HD frames (as bitmaps they would need over 1 GB).
 * The array is sparse while loading: the sequence draws the nearest frame it has.
 */
const loaded: Record<SeqKey, (HTMLImageElement | undefined)[]> = { a: [], b: [] };
const version: Record<SeqKey, number> = { a: 0, b: 0 };

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => img.decode().then(() => resolve(img), () => resolve(img));
    img.onerror = () => reject(new Error(`Missing frame ${src}`));
    img.src = src;
  });
}

/**
 * Loads a sequence coarse-first (see loadOrder) with a few parallel requests.
 * `onCoarse` fires once enough frames are in to play the whole animation roughly.
 */
async function loadFrames(key: SeqKey, onCoarse: () => void, onStep?: (fraction: number) => void) {
  const { count } = sequences[key];
  const order = loadOrder(count);
  const coarse = coarseCount(count);
  let next = 0;
  let done = 0;
  let ok = 0;
  let fired = false;

  const worker = async () => {
    while (next < order.length) {
      const i = order[next++];
      try {
        loaded[key][i] = await loadImage(frameUrl(key, i));
        ok++;
        version[key]++;
      } catch {
        /* a missing frame is skipped; its neighbours stand in for it */
      }
      done++;
      if (!fired) onStep?.(Math.min(1, done / coarse));
      if (!fired && done >= coarse) {
        fired = true;
        if (!loaded[key][0]) throw new Error('First frame missing');
        onCoarse();
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  if (!ok) throw new Error(`No frames for ${key}`);
  if (!fired) onCoarse();
}

/* ---------- Atmosphere: soft glow, drifting dust, pointer spotlight ---------- */
function Atmosphere() {
  const ambient = useRef<HTMLDivElement>(null);
  const lattice = useRef<HTMLDivElement>(null);
  const dust = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = prefersReducedMotion();
    const canvas = dust.current!;
    const ctx = canvas.getContext('2d')!;
    let w = 0;
    let h = 0;
    const resize = () => {
      w = canvas.width = innerWidth;
      h = canvas.height = innerHeight;
    };
    resize();
    addEventListener('resize', resize);

    const dots = Array.from({ length: innerWidth < 700 ? 16 : 48 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 0.9 + 0.3,
      s: Math.random() * 0.000012 + 0.000004,
      warm: Math.random() < 0.14,
    }));

    const off = subscribe(() => {
      // Only transforms are written here, so scrolling never forces the page to re-layout.
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      ambient.current!.style.transform = `translate3d(0,${(scrollY / max) * 65}vh,0)`;
      if (reduce) return;
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.y = (d.y - d.s + 1) % 1;
        ctx.fillStyle = d.warm ? 'rgba(169,191,212,.3)' : 'rgba(236,232,225,.16)';
        ctx.beginPath();
        ctx.arc(d.x * w, d.y * h, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    let move: ((e: PointerEvent) => void) | null = null;
    if (!reduce && matchMedia('(pointer: fine)').matches) {
      move = (e: PointerEvent) => {
        lattice.current!.style.transform = `translate3d(${e.clientX - 260}px,${e.clientY - 260}px,0)`;
        lattice.current!.classList.add('is-on');
      };
      addEventListener('pointermove', move, { passive: true });
    }

    return () => {
      off();
      removeEventListener('resize', resize);
      if (move) removeEventListener('pointermove', move);
    };
  }, []);

  return (
    <>
      <div ref={ambient} className="ambient" />
      <div ref={lattice} className="lattice" />
      <canvas ref={dust} className="dust" aria-hidden="true" />
    </>
  );
}

/* ---------- Scroll-driven image sequence ---------- */
function Sequence({ kind, ready }: { kind: SeqKey; ready: boolean }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ready) return;
    const el = section.current!;
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    const frames = loaded[kind];
    const { focusX } = sequences[kind];
    const reduce = prefersReducedMotion();

    const introEl = el.querySelector<HTMLElement>('.intro');
    const middleEl = el.querySelector<HTMLElement>('.middle');
    const endEl = el.querySelector<HTMLElement>('.end');

    let w = 0;
    let h = 0;
    let top = 0;
    let travel = 1;
    let visible = true;
    let lastPos = -1;

    const measure = () => {
      const rect = c.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(devicePixelRatio, 2);
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingQuality = 'high';
      top = el.getBoundingClientRect().top + scrollY;
      travel = Math.max(1, el.offsetHeight - innerHeight);
      lastPos = -1;
    };

    const total = sequences[kind].count;

    const paint = (im: HTMLImageElement, alpha: number) => {
      const scale = Math.max(w / im.naturalWidth, h / im.naturalHeight);
      const iw = im.naturalWidth * scale;
      const ih = im.naturalHeight * scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(im, (w - iw) * focusX, (h - ih) / 2, iw, ih);
    };

    /** The frame at i, or the closest one that has finished loading. */
    const nearest = (i: number) => {
      for (let d = 0; d < total; d++) {
        const before = frames[i - d];
        if (before) return before;
        const after = frames[i + d];
        if (after) return after;
      }
      return undefined;
    };

    let lastVersion = -1;
    const drawAt = (pos: number) => {
      if (Math.abs(pos - lastPos) < 0.0005 && lastVersion === version[kind]) return;
      lastPos = pos;
      lastVersion = version[kind];
      const i = Math.min(Math.floor(pos), total - 1);
      const base = nearest(i);
      if (!base) return;
      // Blend into the next frame for the in-between scroll positions,
      // so motion reads as video rather than a flipbook.
      const next = frames[i + 1];
      const f = next && frames[i] ? pos - i : 0;
      ctx.clearRect(0, 0, w, h);
      paint(base, 1);
      if (f > 0.001) paint(next!, f);
      ctx.globalAlpha = 1;
    };

    const lastOpacity = new Map<HTMLElement, number>();
    const show = (node: HTMLElement | null, opacity: number, y: number) => {
      if (!node) return;
      const prev = lastOpacity.get(node);
      if (prev !== undefined && Math.abs(prev - opacity) < 0.004) return;
      lastOpacity.set(node, opacity);
      node.style.opacity = String(Math.round(opacity * 1000) / 1000);
      node.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
      const hidden = opacity < 0.1;
      if (node.inert !== hidden) node.inert = hidden;
    };

    measure();
    const resizer = new ResizeObserver(measure);
    resizer.observe(document.body);
    const watcher = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { rootMargin: '60% 0px' });
    watcher.observe(el);

    // Reduced motion: show the final frame once, no scroll animation.
    if (reduce) {
      drawAt(total - 1);
      return () => {
        resizer.disconnect();
        watcher.disconnect();
      };
    }

    const off = subscribe(() => {
      if (!visible) return;
      const p = clamp((scrollY - top) / travel);
      // Finish the motion a little before the end so the last pose (and the closing text) can rest.
      drawAt(clamp(p / 0.88) * (total - 1));

      if (kind === 'a') {
        const intro = 1 - smooth((p - 0.08) / 0.2);
        const end = smooth((p - 0.68) / 0.16); // after the head turn has settled
        show(introEl, intro, (1 - intro) * -20);
        show(endEl, end, (1 - end) * 26);
      } else {
        const intro = 1 - smooth((p - 0.16) / 0.16);
        const middle = smooth((p - 0.3) / 0.14) * (1 - smooth((p - 0.58) / 0.14));
        const end = smooth((p - 0.74) / 0.14);
        show(introEl, intro, (1 - intro) * -20);
        show(middleEl, middle, (1 - middle) * 26);
        show(endEl, end, (1 - end) * 26);
      }
    });

    return () => {
      off();
      resizer.disconnect();
      watcher.disconnect();
    };
  }, [ready, kind]);

  return (
    <section
      ref={section}
      className={`sequence sequence-${kind}${ready ? ' is-ready' : ''}`}
      id={kind === 'a' ? 'home' : 'craft'}
      aria-label={kind === 'a' ? 'Introduction' : 'What I do'}
    >
      <div className="sequence-stage">
        <canvas ref={canvas} aria-hidden="true" />
        <div className="frame-shade" />
        {kind === 'a' ? (
          <>
            <div className="hero-copy intro">
              <span className="eyebrow">Hi, I’m Madusha · IT undergraduate at UoM</span>
              <h1>
                I build
                <br />
                useful things
                <br />
                with <em>code &amp; AI.</em>
              </h1>
              <p>
                Full-stack apps, AI agents and IoT systems,
                <br />
                built for real problems in Sri Lanka.
              </p>
              <a className="text-link" href="#projects">
                See what I’ve built <span>↗</span>
              </a>
            </div>
            <div className="hero-copy end">
              <span className="eyebrow">Full-stack · AI/ML · IoT</span>
              <h2>
                Madusha
                <br />
                <em>Damith.</em>
              </h2>
              <p>
                Second-year IT undergraduate at the
                <br />
                University of Moratuwa, Sri Lanka.
              </p>
              <a href="#about" className="text-link">
                My journey so far <span>↓</span>
              </a>
            </div>
            <div className="scene-footer">
              <span>Moratuwa, Sri Lanka · 2026</span>
              <a href="#about">
                Scroll to explore <b>↓</b>
              </a>
              <span>01 · Hello</span>
            </div>
          </>
        ) : (
          <>
            <div className="craft-copy intro">
              <span className="eyebrow">01 · Understand</span>
              <h2>
                Headphones on.
                <br />
                <em>Problem first.</em>
              </h2>
              <p>
                Before any code: who is this for? Citizens,
                <br />
                drivers, villagers near elephant corridors.
              </p>
            </div>
            <div className="craft-copy middle">
              <span className="eyebrow">02 · Build</span>
              <h2>
                Screen to
                <br />
                <em>server.</em>
              </h2>
              <p>
                React and React Native on the surface.
                <br />
                Spring Boot, Node and FastAPI underneath.
              </p>
            </div>
            <div className="craft-copy end">
              <span className="eyebrow">03 · Make it smart</span>
              <h2>
                Then add
                <br />
                the <em>intelligence.</em>
              </h2>
              <p>
                Agents, RAG and vision models,
                <br />
                AI that does real work.
              </p>
              <a className="text-link" href="#projects">
                See it in my projects <span>↘</span>
              </a>
            </div>
            <div className="scene-footer">
              <span>How I work</span>
              <span>02 · Process</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ---------- Page ---------- */
function App() {
  const [ready, setReady] = useState(false);
  const [readyB, setReadyB] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [failedB, setFailedB] = useState(false);
  const [active, setActive] = useState('home');
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const bar = useRef<HTMLDivElement>(null);

  // The loading screen waits only for a coarse pass of the portrait (about 12 frames).
  // The rest of the portrait, then the second animation, stream in behind it.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await loadFrames('a', () => alive && setReady(true), f => alive && setProgress(f));
      } catch {
        if (alive) {
          setFailed(true);
          setReady(true);
        }
        return;
      }
      try {
        await loadFrames('b', () => alive && setReadyB(true));
      } catch {
        if (alive) setFailedB(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const stopSmooth = startSmoothScroll();
    const sections = ['contact', 'projects', 'about', 'home'].map(id => document.getElementById(id));
    let lastY = -1;
    let lastActive = '';

    const off = subscribe(() => {
      if (scrollY === lastY) return;
      lastY = scrollY;
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      if (bar.current) bar.current.style.transform = `scaleX(${clamp(scrollY / max)})`;
      for (const s of sections) {
        if (s && s.getBoundingClientRect().top < innerHeight * 0.5) {
          if (s.id !== lastActive) {
            lastActive = s.id;
            setActive(s.id);
          }
          break;
        }
      }
    });

    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    document.querySelectorAll('.reveal').forEach(e => observer.observe(e));

    return () => {
      off();
      stopSmooth();
      observer.disconnect();
    };
  }, [ready]);

  useEffect(() => {
    document.body.style.overflow = ready ? '' : 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [ready]);

  function openProject(i: number) {
    setSelected(i);
    dialog.current?.showModal();
    getLenis()?.stop();
  }

  return (
    <>
      <a className="skip" href="#about">
        Skip animation to content
      </a>
      <Atmosphere />
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <div className={`loader${ready ? ' is-gone' : ''}`} role="status" aria-hidden={ready}>
        <span className="monogram">
          md<span>.</span>
        </span>
        <p>Setting the scene</p>
        <div>
          <i style={{ transform: `scaleX(${progress})` }} />
        </div>
        <small>{String(Math.round(progress * 100)).padStart(3, '0')}</small>
      </div>
      <header>
        <a href="#home" className="monogram" aria-label="Madusha home">
          md<span>.</span>
        </a>
        <nav aria-label="Main navigation">
          {['home', 'about', 'projects', 'contact'].map(n => (
            <a key={n} className={active === n ? 'active' : ''} href={`#${n}`} aria-current={active === n ? 'location' : undefined}>
              {n}
            </a>
          ))}
        </nav>
        <a href="#contact" className="nav-cta magnetic" data-pull="0.25">
          Let’s talk <span>↗</span>
        </a>
        <div className="nav-progress" ref={bar} />
      </header>
      <main>
        {failed ? (
          <section className="fallback" id="home">
            <h1>
              Madusha <em>Damith.</em>
            </h1>
            <p>The intro animation could not load. You can still explore the portfolio below.</p>
            <button onClick={() => location.reload()}>Retry</button>
          </section>
        ) : (
          <Sequence kind="a" ready={ready} />
        )}
        <Marquee items={marquees.top} />
        <section id="about" className="about wrap">
          <div className="section-top reveal">
            <span className="eyebrow">A little about me</span>
            <span className="status">
              <i /> Open to opportunities
            </span>
          </div>
          <div className="about-grid">
            <Split text="A builder at heart.|A learner, *always.*" />
            <div className="reveal">
              <p>{profile.bio}</p>
              <div className="about-details">
                <span>
                  Based in
                  <br />
                  <strong>Sri Lanka</strong>
                </span>
                <span>
                  Studying at
                  <br />
                  <strong>University of Moratuwa</strong>
                </span>
              </div>
            </div>
          </div>
          <Timeline />
        </section>
        {!failed && !failedB && <Sequence kind="b" ready={readyB} />}
        <Projects onOpen={openProject} />
        <Marquee items={marquees.bottom} reverse variant="outline" />
        <section id="skills" className="wrap skills">
          <div className="section-top reveal">
            <span className="eyebrow">The toolkit</span>
            <span className="eyebrow">Always learning the next one</span>
          </div>
          <div className="skills-heading">
            <Split text="Tools I|*reach for.*" />
            <p className="reveal">
              Six groups, one goal: build things that work.
              <br />
              Hover a group, or grab the sphere and spin it.
            </p>
          </div>
          <div className="reveal">
            <Stack />
          </div>
        </section>
        <Finale />
      </main>
      <dialog
        ref={dialog}
        data-lenis-prevent
        onClose={() => getLenis()?.start()}
        onClick={e => {
          if (e.target === dialog.current) dialog.current.close();
        }}
      >
        <button className="close" onClick={() => dialog.current?.close()} aria-label="Close case study">
          ✕
        </button>
        {selected !== null && <CaseStudy p={projects[selected]} />}
      </dialog>
    </>
  );
}

// No StrictMode: in development it would mount twice and download every frame twice.
createRoot(document.getElementById('root')!).render(<App />);
