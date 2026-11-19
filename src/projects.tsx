import { useEffect, useRef, type CSSProperties } from 'react';
import { profile, projects, type Project } from './data';
import { clamp, prefersReducedMotion, subscribe } from './motion';
import { Split } from './fx';

/* ======================================================================
   Placeholder visuals, one per project. They are drawn in code so the
   page looks finished before you have screenshots. As soon as you add
   `image` or `video` to a project in data.ts, that is shown instead.
   ====================================================================== */
function heat(seed: number) {
  // Small deterministic pseudo-random sequence, so the heatmap looks the same on every visit.
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

function Art({ slug }: { slug: string }) {
  switch (slug) {
    case 'smartgov':
      return (
        <div className="art art-smartgov">
          <div className="phone">
            <div className="phone-top">
              <b>SmartGov</b>
              <small>AI assistant · online</small>
            </div>
            <div className="bubble me">How do I renew my passport?</div>
            <div className="bubble ai">
              You’ll need your current passport, NIC and two photos. The fee and the nearest office are listed below.
              <span className="cite">gic.gov.lk · Immigration</span>
            </div>
            <div className="bubble me file">NIC_front.jpg</div>
            <div className="verify">
              <i>✓</i>
              <div>
                <b>NIC verified</b>
                <small>New format · confidence 0.97</small>
              </div>
            </div>
          </div>
          <div className="agent-graph">
            <span>Agent</span>
            <i />
            <span>Tools</span>
            <i />
            <span>Answer</span>
          </div>
        </div>
      );
    case 'waypoint':
      return (
        <div className="art art-waypoint">
          <div className="kiosk">
            <div className="kiosk-top">
              <b>Bay 2 · VEH057</b>
              <span>Loading · LIFO</span>
            </div>
            <div className="truck-bed">
              {[
                ['OUT080', 6, 'done'],
                ['OUT079', 8, 'done'],
                ['OUT077', 10, 'now'],
              ].map(([o, n, st]) => (
                <div className={`zone ${st}`} key={o as string}>
                  <small>{o as string}</small>
                  <div className="crates">
                    {Array.from({ length: n as number }, (_, i) => (
                      <i key={i} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="kiosk-progress">
              <span>Crates loaded</span>
              <b>18 / 24</b>
              <div>
                <i />
              </div>
            </div>
          </div>
          <div className="roles">
            {['Store manager', 'Dispatcher', 'Loader', 'Driver'].map(r => (
              <span key={r} className={r === 'Loader' ? 'on' : ''}>
                {r}
              </span>
            ))}
          </div>
        </div>
      );
    case 'elephant':
      return (
        <div className="art art-elephant">
          <div className="radar">
            <i className="sweep" />
            <b className="blip b1" />
            <b className="blip b2" />
            <b className="tower t1" />
            <b className="tower t2" />
            <b className="tower t3" />
          </div>
          <div className="alert-card">
            <span className="pulse" />
            <div>
              <b>Elephant detected</b>
              <small>Tower 02 · 1.2 km north · just now</small>
            </div>
          </div>
          <div className="lora">LoRa · 868 MHz · 3 towers online</div>
        </div>
      );
    case 'devpulse': {
      const r = heat(7);
      return (
        <div className="art art-devpulse">
          <div className="dash">
            <div className="dash-head">
              <i className="avatar" />
              <div>
                <b>@octocat</b>
                <small>42 repos · 1.2k followers</small>
              </div>
              <span className="score">Consistency 86%</span>
            </div>
            <div className="heatmap">
              {Array.from({ length: 26 * 7 }, (_, i) => {
                const v = r();
                const level = v > 0.86 ? 4 : v > 0.66 ? 3 : v > 0.42 ? 2 : v > 0.22 ? 1 : 0;
                return <i key={i} className={`l${level}`} />;
              })}
            </div>
            <div className="langs">
              <span style={{ ['--w' as string]: '44%' }}>TypeScript</span>
              <span style={{ ['--w' as string]: '27%' }}>JavaScript</span>
              <span style={{ ['--w' as string]: '18%' }}>Java</span>
              <span style={{ ['--w' as string]: '11%' }}>Python</span>
            </div>
          </div>
        </div>
      );
    }
    case 'nexus':
      return (
        <div className="art art-nexus">
          <svg viewBox="0 0 600 300" className="route" aria-hidden="true">
            <path id="nexus-route" d="M60 220 C160 220 150 80 260 90 S380 230 460 160 S530 70 560 80" />
            <circle r="6" className="truck">
              <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
                <mpath href="#nexus-route" />
              </animateMotion>
            </circle>
          </svg>
          <span className="stop s1">Manufacturer</span>
          <span className="stop s2">Warehouse</span>
          <span className="stop s3">Agency</span>
          <span className="stop s4">Outlet</span>
          <div className="nexus-stats">
            <div>
              <small>Trips today</small>
              <b>24</b>
            </div>
            <div>
              <small>On time</small>
              <b>96%</b>
            </div>
          </div>
        </div>
      );
    case 'cinematch':
      return (
        <div className="art art-cinematch">
          <div className="moods">
            {['Happy', 'Relaxed', 'Excited', 'Romantic'].map((m, i) => (
              <span key={m} className={i === 2 ? 'on' : ''}>
                {m}
              </span>
            ))}
          </div>
          <div className="posters">
            {Array.from({ length: 5 }, (_, i) => (
              <i key={i} style={{ ['--h' as string]: `${i * 47 + 330}` } as CSSProperties} />
            ))}
          </div>
          <small className="pick">Tonight’s match · 18–24 · Sci-Fi</small>
        </div>
      );
    default:
      return <div className="art" />;
  }
}

export function ProjectVisual({ p, eager = false }: { p: Project; eager?: boolean }) {
  if (p.video)
    return <video className="project-media" src={p.video} poster={p.image} muted loop playsInline autoPlay preload={eager ? 'auto' : 'metadata'} />;
  if (p.image) return <img className="project-media" src={p.image} alt={`${p.title} screenshot`} loading={eager ? 'eager' : 'lazy'} />;
  return <Art slug={p.slug} />;
}

/* ======================================================================
   Projects: the section pins in place and the cards slide sideways while
   you scroll down. On phones it becomes a normal vertical list.
   ====================================================================== */
export function Projects({ onOpen }: { onOpen: (i: number) => void }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = section.current!;
    const tr = track.current!;
    const cards = [...tr.querySelectorAll<HTMLElement>('.pcard')];
    const visuals = cards.map(c => c.querySelector<HTMLElement>('.pcard-visual-inner')!);

    let horizontal = false;
    let top = 0;
    let distance = 1;
    let centers: number[] = [];
    let visible = false;
    let lastP = -1;
    let lastIndex = -1;

    const measure = () => {
      horizontal = innerWidth > 900 && !prefersReducedMotion();
      el.classList.toggle('is-horizontal', horizontal);
      if (!horizontal) {
        el.style.height = '';
        tr.style.transform = '';
        visuals.forEach(v => (v.style.transform = ''));
        return;
      }
      distance = Math.max(1, tr.scrollWidth - innerWidth);
      el.style.height = `${innerHeight + distance}px`;
      top = el.getBoundingClientRect().top + scrollY;
      centers = cards.map(c => c.offsetLeft + c.offsetWidth / 2);
      lastP = -1;
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '30% 0px' });
    io.observe(el);

    const off = subscribe(() => {
      if (!horizontal || !visible) return;
      const p = clamp((scrollY - top) / distance);
      if (Math.abs(p - lastP) < 0.0002) return;
      lastP = p;
      const x = -p * distance;
      tr.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      bar.current!.style.transform = `scaleX(${p})`;

      // Parallax: each picture drifts a little against the card it sits in.
      const mid = innerWidth / 2;
      let nearest = 0;
      let best = Infinity;
      centers.forEach((c, i) => {
        const d = c + x - mid;
        if (Math.abs(d) < best) {
          best = Math.abs(d);
          nearest = i;
        }
        visuals[i].style.transform = `translate3d(${(d * -0.06).toFixed(1)}px,0,0) scale(1.08)`;
      });
      if (nearest !== lastIndex) {
        lastIndex = nearest;
        count.current!.textContent = String(nearest + 1).padStart(2, '0');
        cards.forEach((c, i) => c.classList.toggle('is-current', i === nearest));
      }
    });

    return () => {
      off();
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <section id="projects" className="projects-h" ref={section}>
      <div className="projects-stage">
        <div className="projects-hud">
          <span className="eyebrow">Selected work</span>
          <span className="hud-count">
            <span ref={count}>01</span> / {String(projects.length).padStart(2, '0')}
          </span>
          <div className="hud-bar">
            <div ref={bar} />
          </div>
        </div>
        <div className="projects-track" ref={track}>
          <div className="projects-intro">
            <span className="eyebrow">Things I’ve built</span>
            <Split text="Made with|*intent.*" />
            <p className="reveal">
              An AI agent for public services, a live hackathon platform, an IoT early-warning network and more. Keep scrolling, and click any card for the full story.
            </p>
            <span className="scroll-hint reveal">
              Keep scrolling <b>→</b>
            </span>
          </div>

          {projects.map((p, i) => (
            <article className="pcard" key={p.slug} style={{ ['--tint' as string]: p.tint } as CSSProperties}>
              <button className="pcard-visual" data-cursor="View" onClick={() => onOpen(i)} aria-label={`Open ${p.title} case study`}>
                <div className="pcard-visual-inner">
                  <ProjectVisual p={p} />
                </div>
                {p.status && <span className="pcard-status">{p.status}</span>}
              </button>
              <div className="pcard-caption">
                <span className="pcard-num">0{i + 1}</span>
                <div className="pcard-text">
                  <h3>{p.title}</h3>
                  <p>{p.tagline}</p>
                </div>
                <div className="pcard-meta">
                  <span>{p.year}</span>
                  <div className="tags">
                    {p.stack.slice(0, 4).map(s => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}

          <div className="projects-outro">
            <Split text="More in|the *making.*" as="p" className="outro-title" />
            <a className="round-link magnetic" href={profile.github} target="_blank" rel="noreferrer" data-cursor="Open">
              <span>
                GitHub <b>↗</b>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Case-study content shown in the dialog. */
export function CaseStudy({ p }: { p: Project }) {
  return (
    <>
      <div className="case-head">
        <span className="eyebrow">
          {p.year}
          {p.status ? ` · ${p.status}` : ''}
        </span>
        <h2>{p.title}</h2>
        <p className="case-tagline">{p.tagline}</p>
      </div>
      <div className="case-visual" style={{ ['--tint' as string]: p.tint } as CSSProperties}>
        <ProjectVisual p={p} eager />
      </div>
      <p>{p.description}</p>
      <ul className="case-list">
        {p.highlights.map(h => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      <div className="tags">
        {p.stack.map(s => (
          <span key={s}>{s}</span>
        ))}
      </div>
      <div className="case-links">
        {p.links.live && (
          <a href={p.links.live} target="_blank" rel="noreferrer" className="btn btn-solid">
            Live demo ↗
          </a>
        )}
        {p.links.code && (
          <a href={p.links.code} target="_blank" rel="noreferrer" className="btn">
            Source code ↗
          </a>
        )}
      </div>
    </>
  );
}
