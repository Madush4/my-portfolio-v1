import { useEffect, useRef } from 'react';
import { profile } from './data';
import { clamp, prefersReducedMotion, subscribe } from './motion';

const LINE_1 = ['I’m', 'ready', 'to', 'build.'];
const LINE_2 = ['Are', 'you?'];

/**
 * The closing scene. The screen holds still while the words light up one by one
 * as you scroll, then the "Let's talk" button and links appear.
 */
export function Finale() {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = section.current!;
    const words = [...el.querySelectorAll<HTMLElement>('.fw')];
    const stage = el.querySelector<HTMLElement>('.finale-stage')!;
    const glow = el.querySelector<HTMLElement>('.finale-glow')!;

    if (prefersReducedMotion()) {
      el.classList.add('is-done');
      words.forEach(w => (w.style.opacity = '1'));
      return;
    }

    let top = 0;
    let travel = 1;
    let visible = false;
    let last = -1;
    let done = false;
    const measure = () => {
      top = el.getBoundingClientRect().top + scrollY;
      travel = Math.max(1, el.offsetHeight - innerHeight);
      last = -1;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '20% 0px' });
    io.observe(el);

    const off = subscribe(() => {
      if (!visible) return;
      const p = clamp((scrollY - top) / travel);
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      // Words light up during the first 70% of the scroll.
      const n = words.length;
      words.forEach((w, i) => {
        const o = clamp(p / 0.7 * n - i);
        w.style.opacity = String(0.1 + o * 0.9);
        w.style.transform = `translate3d(0,${((1 - o) * 0.18).toFixed(3)}em,0)`;
        w.style.filter = o < 1 ? `blur(${((1 - o) * 6).toFixed(1)}px)` : '';
      });
      glow.style.opacity = String(clamp((p - 0.45) / 0.35));
      stage.style.setProperty('--p', p.toFixed(3));
      const nowDone = p > 0.72;
      if (nowDone !== done) {
        done = nowDone;
        el.classList.toggle('is-done', done);
      }
    });

    return () => {
      off();
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const href = profile.email ? `mailto:${profile.email}` : profile.linkedin;

  return (
    <section id="contact" className="finale" ref={section}>
      <div className="finale-stage">
        <div className="finale-glow" aria-hidden="true" />
        <div className="finale-main">
        <span className="eyebrow finale-eyebrow">Your next idea starts here</span>
        <h2 className="finale-words" aria-label="I’m ready to build. Are you?">
          <span className="finale-line" aria-hidden="true">
            {LINE_1.map(w => (
              <span className="fw" key={w}>
                {w}
              </span>
            ))}
          </span>
          <span className="finale-line accent" aria-hidden="true">
            {LINE_2.map(w => (
              <span className="fw" key={w}>
                {w}
              </span>
            ))}
          </span>
        </h2>
        <div className="finale-cta">
          <a className="talk magnetic" data-pull="0.35" href={href} target={profile.email ? undefined : '_blank'} rel="noreferrer">
            <span>
              Let’s talk
              <b>↗</b>
            </span>
          </a>
          <div className="finale-links">
            <a href={profile.linkedin} target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
            <a href={profile.github} target="_blank" rel="noreferrer">
              GitHub ↗
            </a>
            {profile.email ? <a href={`mailto:${profile.email}`}>{profile.email}</a> : <span>Email · add yours in data.ts</span>}
          </div>
        </div>
        </div>
        <div className="finale-foot">
          <a href="#home" className="monogram">
            md<span>.</span>
          </a>
          <span>© {new Date().getFullYear()} Madusha Damith · Built with React</span>
          <a href="#home">Back to top ↑</a>
        </div>
      </div>
    </section>
  );
}
