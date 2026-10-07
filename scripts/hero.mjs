// Hero banner: name + an exploded isometric "design → code → data" stack.
import { THEMES, ACCENTS, makeIso, box, quad, text, measure, svgDoc, mix, r } from './lib/iso.mjs';

const W = 1200;
const H = 480;

export function hero(themeName) {
  const T = THEMES[themeName];
  const dark = themeName === 'dark';
  const iso = makeIso(40, 930, 178);
  const out = [];

  // ---------- Left column: copy -------------------------------------------
  const X = 64;
  out.push(`<g class="copy">`);
  out.push(`<circle class="pulse" cx="${X + 5}" cy="140" r="5" fill="${ACCENTS.emerald[1]}"/>`);
  out.push(`<circle cx="${X + 5}" cy="140" r="5" fill="${ACCENTS.emerald[1]}"/>`);
  out.push(text('mono', 'WEB DEVELOPER  ·  BUT MMI  →  42', X + 20, 145, 14, { tracking: 1.6, fill: T.muted }));
  out.push(text('sans', 'Hugo Delacour', X - 4, 238, 88, { tracking: -3.2, fill: T.text }));
  out.push(text('regular', 'Web developer from France. I design and build fast,', X, 290, 22, { fill: T.muted }));
  out.push(text('regular', 'accessible products, from UI/UX & SEO to the database.', X, 320, 22, { fill: T.muted }));

  // Focus chips
  const chips = [
    ['UI/UX', ACCENTS.violet[1]],
    ['Accessibility', ACCENTS.cyan[1]],
    ['SEO', ACCENTS.emerald[1]],
  ];
  out.push(text('mono', 'FOCUS', X, 384, 12, { tracking: 1.6, fill: T.muted }));
  let cx = X + 62;
  for (const [label, color] of chips) {
    const w = measure('mono', label, 13) + 36;
    out.push(`<rect x="${r(cx)}" y="365" width="${r(w)}" height="28" rx="14" fill="${dark ? '#161b22' : '#f6f8fa'}" stroke="${T.line}"/>`);
    out.push(`<circle cx="${r(cx + 15)}" cy="379" r="3.5" fill="${color}"/>`);
    out.push(text('mono', label, cx + 25, 384, 13, { fill: T.text }));
    cx += w + 8;
  }
  out.push(`</g>`);

  // ---------- Right column: isometric scene -------------------------------
  const g = [];

  // Soft ground shadow + base slab with a faint grid.
  const base = { x: 0, y: 0, z: 0, w: 6, d: 6, h: 0.32 };
  g.push(box(iso, base, T.base, { stroke: T.edge, sw: 1 }));
  for (let i = 1; i < 6; i++) {
    const a = iso.p(i, 0, base.h), b = iso.p(i, 6, base.h);
    const c = iso.p(0, i, base.h), d = iso.p(6, i, base.h);
    g.push(`<path d="M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}M${r(c[0])} ${r(c[1])}L${r(d[0])} ${r(d[1])}" stroke="${T.line}" stroke-width="0.75" opacity="${dark ? 0.55 : 0.8}"/>`);
  }

  // Shadow cast by the floating stack onto the slab.
  g.push(`<g class="shadow">${quad(iso, { x: 0.9, y: 1.4, z: base.h, w: 3.4, d: 2.8 }, `fill="${T.shadow}" filter="url(#blur)"`)}</g>`);

  // Exploded UI layers: wireframe → components → motion/glass.
  const P = { x: 0.9, y: 1.4, w: 3.4, d: 2.8, h: 0.1 };
  const layers = [
    { z: 1.1, kind: 'wire' },
    { z: 2.25, kind: 'ui' },
    { z: 3.4, kind: 'glass' },
  ];

  // Dashed guides linking the layers (exploded-view convention).
  const guide = [];
  for (const [gx, gy] of [[P.x, P.y + P.d], [P.x + P.w, P.y + P.d], [P.x + P.w, P.y]]) {
    const a = iso.p(gx, gy, base.h), b = iso.p(gx, gy, layers[2].z);
    guide.push(`M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}`);
  }
  g.push(`<path d="${guide.join('')}" stroke="${T.faint}" stroke-width="1" stroke-dasharray="3 5" opacity="0.7"/>`);

  layers.forEach((L, i) => {
    const parts = [];
    const z = L.z;
    const top = z + P.h;
    if (L.kind === 'wire') {
      parts.push(box(iso, { ...P, z }, { top: T.top, left: T.left, right: T.right }, { stroke: T.edge }));
      // Wireframe blocks with dashed outlines.
      const wf = `fill="none" stroke="${T.muted}" stroke-width="1" stroke-dasharray="4 3" opacity="0.8"`;
      parts.push(quad(iso, { x: P.x + 0.2, y: P.y + 0.2, z: top, w: 3.0, d: 0.35 }, wf));
      parts.push(quad(iso, { x: P.x + 0.2, y: P.y + 0.75, z: top, w: 0.9, d: 1.85 }, wf));
      parts.push(quad(iso, { x: P.x + 1.3, y: P.y + 0.75, z: top, w: 1.9, d: 0.85 }, wf));
      parts.push(quad(iso, { x: P.x + 1.3, y: P.y + 1.8, z: top, w: 1.9, d: 0.8 }, wf));
    } else if (L.kind === 'ui') {
      parts.push(box(iso, { ...P, z }, { top: T.top, left: T.left, right: T.right }, { stroke: T.edge }));
      parts.push(quad(iso, { x: P.x + 0.2, y: P.y + 0.2, z: top, w: 3.0, d: 0.35 }, `fill="${dark ? '#2b323c' : '#e9edf1'}"`));
      parts.push(quad(iso, { x: P.x + 0.3, y: P.y + 0.3, z: top, w: 0.15, d: 0.15 }, `fill="${ACCENTS.rose[1]}"`));
      parts.push(quad(iso, { x: P.x + 0.55, y: P.y + 0.3, z: top, w: 0.15, d: 0.15 }, `fill="${ACCENTS.amber[1]}"`));
      parts.push(quad(iso, { x: P.x + 0.8, y: P.y + 0.3, z: top, w: 0.15, d: 0.15 }, `fill="${ACCENTS.emerald[1]}"`));
      parts.push(quad(iso, { x: P.x + 0.2, y: P.y + 0.75, z: top, w: 0.9, d: 1.85 }, `fill="${dark ? '#252b34' : '#eef1f4'}"`));
      for (let k = 0; k < 4; k++) {
        parts.push(quad(iso, { x: P.x + 0.35, y: P.y + 0.95 + k * 0.38, z: top, w: 0.6, d: 0.12 }, `fill="${k === 0 ? ACCENTS.violet[1] : T.faint}" opacity="${k === 0 ? 1 : 0.6}"`));
      }
      // Raised cards
      parts.push(box(iso, { x: P.x + 1.3, y: P.y + 0.75, z: top, w: 1.9, d: 0.85, h: 0.08 }, { top: ACCENTS.cyan[0], left: ACCENTS.cyan[1], right: ACCENTS.cyan[2] }));
      parts.push(box(iso, { x: P.x + 1.3, y: P.y + 1.8, z: top, w: 0.85, d: 0.8, h: 0.08 }, { top: ACCENTS.violet[0], left: ACCENTS.violet[1], right: ACCENTS.violet[2] }));
      parts.push(box(iso, { x: P.x + 2.35, y: P.y + 1.8, z: top, w: 0.85, d: 0.8, h: 0.08 }, { top: dark ? '#2b323c' : '#e9edf1', left: dark ? '#20262e' : '#dde2e7', right: dark ? '#1a1f26' : '#d0d6dc' }));
    } else {
      parts.push(box(iso, { ...P, z }, { top: 'url(#glass)', left: mix(ACCENTS.violet[1], dark ? '#0d1117' : '#ffffff', 0.35), right: mix(ACCENTS.violet[2], dark ? '#0d1117' : '#ffffff', 0.3) }, { stroke: mix(ACCENTS.violet[0], '#ffffff', 0.3), sw: 0.75, extra: ' fill-opacity="0.82"' }));
      // Motion curve printed on the glass.
      parts.push(`<path transform="${iso.topMatrix(P.x, P.y, top)}" d="M0.35 2.35 C 1.2 2.35, 1.3 0.45, 3.05 0.45" stroke="#ffffff" stroke-width="0.05" stroke-linecap="round" fill="none" opacity="0.95"/>`);
      parts.push(`<circle transform="${iso.topMatrix(P.x, P.y, top)}" cx="0.35" cy="2.35" r="0.09" fill="#ffffff"/>`);
      parts.push(`<circle transform="${iso.topMatrix(P.x, P.y, top)}" cx="3.05" cy="0.45" r="0.09" fill="#ffffff"/>`);
      parts.push(`<g transform="${iso.topMatrix(P.x, P.y, top)}"><circle r="0.13" fill="#ffffff"><animateMotion dur="3.6s" repeatCount="indefinite" keyPoints="0;1;1;0;0" keyTimes="0;0.4;0.5;0.9;1" calcMode="linear" path="M0.35 2.35 C 1.2 2.35, 1.3 0.45, 3.05 0.45"/></circle></g>`);
    }
    g.push(`<g class="float f${i}">${parts.join('')}</g>`);
  });

  // "42" block and a small cube staircase on the right of the slab.
  const cubeFaces = { top: T.top, left: T.left, right: T.right };
  g.push(box(iso, { x: 4.55, y: 0.45, z: base.h, w: 1.1, d: 1.1, h: 1.1 }, cubeFaces, { stroke: T.edge }));
  g.push(text('sans', '42', 0, 0, 62, { fill: T.text, attrs: `transform="${iso.leftMatrix(4.55, 1.55, base.h + 1.1)} translate(0.2 0.8) scale(0.01)"` }));
  g.push(`<g class="bob b1">${box(iso, { x: 4.85, y: 0.75, z: base.h + 1.45, w: 0.5, d: 0.5, h: 0.5 }, { top: ACCENTS.amber[0], left: ACCENTS.amber[1], right: ACCENTS.amber[2] })}</g>`);

  // Database (Postgres / Neon): three stacked discs, front corner of the slab.
  const R = 0.72;
  const [dbx, dby] = iso.p(4.75, 4.7, base.h);
  const rx = R * Math.SQRT2 * Math.cos(Math.PI / 6) * iso.s, ry = R * Math.SQRT2 * 0.5 * iso.s;
  g.push(`<ellipse cx="${r(dbx + 6)}" cy="${r(dby + 4)}" rx="${r(rx + 8)}" ry="${r(ry + 5)}" fill="${T.shadow}" filter="url(#blur)"/>`);
  const disc = (z0, h, i) => {
    const yb = dby - z0 * iso.s, yt = yb - h * iso.s;
    return `<g class="disc d${i}">` +
      `<path d="M${r(dbx - rx)} ${r(yt)}V${r(yb)}A${r(rx)} ${r(ry)} 0 0 0 ${r(dbx + rx)} ${r(yb)}V${r(yt)}Z" fill="url(#dbside)"/>` +
      `<ellipse cx="${r(dbx)}" cy="${r(yt)}" rx="${r(rx)}" ry="${r(ry)}" fill="${ACCENTS.emerald[0]}" stroke="${mix(ACCENTS.emerald[0], '#ffffff', 0.35)}" stroke-width="0.8"/>` +
      `</g>`;
  };
  g.push(disc(0, 0.42, 0) + disc(0.54, 0.42, 1) + disc(1.08, 0.42, 2));

  // Tiny floating cubes for depth.
  g.push(`<g class="bob b3">${box(iso, { x: 0.2, y: 5.6, z: 2.4, w: 0.32, d: 0.32, h: 0.32 }, { top: ACCENTS.cyan[0], left: ACCENTS.cyan[1], right: ACCENTS.cyan[2] })}</g>`);
  g.push(`<g class="bob b1">${box(iso, { x: -0.4, y: 1.2, z: 3.9, w: 0.26, d: 0.26, h: 0.26 }, { top: ACCENTS.rose[0], left: ACCENTS.rose[1], right: ACCENTS.rose[2] })}</g>`);
  g.push(`<g class="bob b2">${box(iso, { x: 6.5, y: 4.4, z: 1.9, w: 0.22, d: 0.22, h: 0.22 }, { top: ACCENTS.violet[0], left: ACCENTS.violet[1], right: ACCENTS.violet[2] })}</g>`);

  out.push(`<g class="scene">${g.join('\n')}</g>`);

  const style = `
.float { animation: float 6s cubic-bezier(.45,0,.55,1) infinite; }
.f0 { animation-delay: -0s; } .f1 { animation-delay: -0.6s; } .f2 { animation-delay: -1.2s; }
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
.shadow { animation: shadow 6s cubic-bezier(.45,0,.55,1) infinite; }
@keyframes shadow { 0%,100% { opacity: 1; } 50% { opacity: .7; } }
.bob { animation: bob 4.5s cubic-bezier(.45,0,.55,1) infinite; }
.b2 { animation-duration: 5.5s; animation-delay: -2s; } .b3 { animation-duration: 7s; animation-delay: -1s; }
@keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
.disc { animation: disc 5s cubic-bezier(.45,0,.55,1) infinite; }
.d1 { animation-name: disc1; } .d2 { animation-name: disc2; }
@keyframes disc { 0%,100% { transform: none; } }
@keyframes disc1 { 0%,100% { transform: none; } 50% { transform: translateY(-4px); } }
@keyframes disc2 { 0%,100% { transform: none; } 50% { transform: translateY(-9px); } }
.pulse { transform-box: fill-box; transform-origin: center; animation: pulse 2.4s ease-out infinite; }
@keyframes pulse { 0% { transform: scale(1); opacity: .6; } 100% { transform: scale(3); opacity: 0; } }
.copy { animation: in .9s cubic-bezier(.2,.7,.2,1) both; }
.scene { animation: in 1.1s .15s cubic-bezier(.2,.7,.2,1) both; }
@keyframes in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }`;

  const defs = `
<filter id="blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="${ACCENTS.violet[0]}"/>
  <stop offset="0.55" stop-color="${ACCENTS.violet[1]}"/>
  <stop offset="1" stop-color="${ACCENTS.rose[1]}"/>
</linearGradient>
<linearGradient id="dbside" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${ACCENTS.emerald[1]}"/>
  <stop offset="0.5" stop-color="${mix(ACCENTS.emerald[1], ACCENTS.emerald[2], 0.45)}"/>
  <stop offset="1" stop-color="${ACCENTS.emerald[2]}"/>
</linearGradient>`;

  return svgDoc({
    width: W,
    height: H,
    title: 'Hugo Delacour — Web developer',
    desc: 'Hugo Delacour, web developer from France (BUT MMI, then 42), focused on UI/UX, accessibility and SEO. An animated isometric illustration shows an exploded stack of interface layers above a database.',
    style,
    defs,
    body: out.join('\n'),
  });
}
