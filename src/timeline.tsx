import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { journey } from './data';
import { clamp, prefersReducedMotion, subscribe } from './motion';
import { Split } from './fx';

/* ======================================================================
   Timeline as a git graph.
   - A main line runs through every milestone.
   - "branch" milestones fork off to a side lane, pass their commits, and merge back.
   - Everything is drawn as you scroll: the lit lines grow with a glowing head,
     commits light up as the head passes them, and the terminal on the left
     types the current commit message.
   Geometry is measured from the real layout, so it adapts to any text length.
   ====================================================================== */

const pad = (n: number) => String(n).padStart(2, '0');

export function Timeline() {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const headB = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const el = root.current!;
    const graph = el.querySelector<HTMLElement>('.tl-graph')!;
    const items = [...el.querySelectorAll<HTMLElement>('.tl-item')];
    const s = svg.current!;
    const mainBase = s.querySelector<SVGPathElement>('.p-main.base')!;
    const mainLit = [...s.querySelectorAll<SVGPathElement>('.p-main.lit')];
    const branchBase = [...s.querySelectorAll<SVGPathElement>('.p-branch.base')];
    const branchLit = journey.map((_, i) => [...s.querySelectorAll<SVGPathElement>(`.p-branch.lit[data-i="${i}"]`)]);
    const commitEls = items.map(it => [...it.querySelectorAll<HTMLElement>('.tl-commit')]);

    let MAIN = 22;
    let LANE = 84;
    let y0 = 0;
    let yLast = 1;
    let nodeY: number[] = [];
    let branches: { i: number; from: number; to: number; len: number; probe: SVGPathElement }[] = [];
    let commitY: number[][] = [];
    let visible = false;
    let current = -2;
    let lastM = NaN;

    const measure = () => {
      const narrow = innerWidth <= 700;
      MAIN = narrow ? 12 : 22;
      LANE = narrow ? 44 : 84;
      const h = graph.offsetHeight;
      const w = graph.querySelector<HTMLElement>('.tl-gutter')!.offsetWidth;
      s.setAttribute('width', String(w));
      s.setAttribute('height', String(h));
      s.setAttribute('viewBox', `0 0 ${w} ${h}`);

      nodeY = items.map(it => it.offsetTop + 15);
      y0 = nodeY[0];
      yLast = nodeY[nodeY.length - 1];
      const dMain = `M${MAIN} ${y0} L${MAIN} ${yLast}`;
      mainBase.setAttribute('d', dMain);
      mainLit.forEach(p => p.setAttribute('d', dMain));

      branches = [];
      commitY = items.map(() => []);
      let b = 0;
      items.forEach((it, i) => {
        if (journey[i].lane !== 'branch') return;
        const from = nodeY[i];
        const to = it.offsetTop + it.offsetHeight - 10;
        const d =
          `M${MAIN} ${from} C${MAIN} ${from + 46} ${LANE} ${from + 24} ${LANE} ${from + 70} ` +
          `L${LANE} ${to - 70} C${LANE} ${to - 24} ${MAIN} ${to - 46} ${MAIN} ${to}`;
        branchBase[b].setAttribute('d', d);
        branchLit[i].forEach(p => p.setAttribute('d', d));
        const probe = branchLit[i][branchLit[i].length - 1];
        branches.push({ i, from, to, len: probe.getTotalLength(), probe });

        // Commits sit evenly on the straight part of the side lane.
        const cs = commitEls[i];
        const top = from + 84;
        const span = to - 84 - top;
        cs.forEach((c, k) => {
          const y = top + ((k + 0.5) * span) / cs.length;
          commitY[i][k] = y;
          c.style.top = `${y - it.offsetTop}px`;
          c.style.left = `${LANE}px`;
        });
        b++;
      });
      items.forEach(it => it.style.setProperty('--main', `${MAIN}px`));
      lastM = NaN;
      current = -2;
    };

    const apply = (m: number) => {
      if (m === lastM) return;
      lastM = m;

      const pm = clamp((m - y0) / Math.max(1, yLast - y0));
      mainLit.forEach(p => (p.style.strokeDashoffset = String(1 - pm)));
      head.current!.style.transform = `translate3d(${MAIN}px,${clamp(m, y0, yLast)}px,0)`;
      head.current!.classList.toggle('is-on', pm > 0 && pm < 1);

      let branchHead: DOMPoint | null = null;
      for (const br of branches) {
        const p = clamp((m - br.from) / (br.to - br.from));
        branchLit[br.i].forEach(path => (path.style.strokeDashoffset = String(1 - p)));
        if (p > 0 && p < 1) branchHead = br.probe.getPointAtLength(p * br.len);
      }
      if (branchHead) headB.current!.style.transform = `translate3d(${branchHead.x}px,${branchHead.y}px,0)`;
      headB.current!.classList.toggle('is-on', !!branchHead);

      commitEls.forEach((cs, i) => cs.forEach((c, k) => c.classList.toggle('is-lit', m >= commitY[i][k])));

      let reached = -1;
      nodeY.forEach((y, i) => {
        if (m >= y - 1) reached = i;
      });
      if (reached === current) return;
      current = reached;
      items.forEach((it, i) => {
        it.classList.toggle('is-reached', i <= reached);
        it.classList.toggle('is-active', i === reached);
      });
      setStage(Math.max(0, reached));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(graph);

    if (prefersReducedMotion()) {
      apply(1e9);
      return () => ro.disconnect();
    }

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '20% 0px' });
    io.observe(el);
    const off = subscribe(() => {
      if (!visible) return;
      apply(Math.round(innerHeight * 0.55 - graph.getBoundingClientRect().top));
    });

    return () => {
      off();
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const j = journey[stage];
  const branchCount = journey.filter(x => x.lane === 'branch').length;
  const cmd = `git commit -m "${j.msg}"`;

  return (
    <div className="tl" ref={root}>
      <div className="tl-side">
        <span className="eyebrow">The journey so far</span>
        <Split text="Small commits.|*Big direction.*" className="tl-title" />
        <div className="tl-now">
          <span className="tl-count">
            <b>{pad(stage + 1)}</b> / {pad(journey.length)}
          </span>
          <strong key={`b${stage}`} className="tl-now-branch">
            ⎇ {j.branch}
          </strong>
          <span key={`t${stage}`} className="tl-now-time">
            {j.time}
          </span>
        </div>
        <div className="tl-term" aria-hidden="true">
          <div className="tl-term-bar">
            <i />
            <i />
            <i />
            <span>~/madusha</span>
          </div>
          <div className="tl-term-body">
            <div className="dim">$ git checkout {j.branch}</div>
            <div className="typed" key={stage} style={{ ['--n' as string]: cmd.length + 2 } as CSSProperties}>
              $ {cmd}
            </div>
            <div className="dim small">
              [{j.branch} {(0x3fa2c + stage * 0x1b7d).toString(16)}] {j.commits.length} files changed
            </div>
          </div>
        </div>
      </div>

      <div className="tl-graph">
        <div className="tl-gutter" aria-hidden="true">
          <svg ref={svg} className="tl-svg">
            <defs>
              <linearGradient id="tl-main" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#8fb8ff" />
                <stop offset="1" stopColor="#3ddc97" />
              </linearGradient>
            </defs>
            <path className="p-main base" />
            {Array.from({ length: branchCount }, (_, i) => (
              <path key={i} className="p-branch base" />
            ))}
            {/* Lit copies: two soft wide strokes for glow, one crisp core. */}
            {['g2', 'g1', 'core'].map(layer => (
              <g key={layer} className={`lit-${layer}`}>
                <path className="p-main lit" pathLength={1} />
                {journey.map((x, i) => (x.lane === 'branch' ? <path key={i} className="p-branch lit" data-i={i} pathLength={1} /> : null))}
              </g>
            ))}
          </svg>
          <div className="tl-head" ref={head} />
          <div className="tl-head side" ref={headB} />
        </div>
        <ol>
          {journey.map(m => (
            <li className={`tl-item lane-${m.lane}`} key={m.title}>
              <span className="tl-node" aria-hidden="true" />
              {m.lane === 'branch' &&
                m.commits.map(c => (
                  <span className="tl-commit" key={c} aria-hidden="true">
                    <em>{c}</em>
                  </span>
                ))}
              <div className="tl-card">
                <div className="tl-card-top">
                  <span className="tl-time">{m.time}</span>
                  <span className="tl-tag">⎇ {m.branch}</span>
                </div>
                <h3>{m.title}</h3>
                <p>{m.text}</p>
                {m.lane === 'main' && m.commits.length > 0 && (
                  <div className="tl-chips">
                    {m.commits.map(c => (
                      <span key={c}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
