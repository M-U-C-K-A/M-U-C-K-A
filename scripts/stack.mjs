// Tech stack as an isometric mechanical keyboard. Keys are sober and
// monochrome; each one lights up in its brand colour when it gets "typed".
import * as si from 'simple-icons';
import { THEMES, ACCENTS, makeIso, text, measure, glyphSet, svgDoc, mix, luminance, r } from './lib/iso.mjs';

const W = 1000;
const H = 600;

// Adobe icons are not shipped by simple-icons: draw a neutral two-letter mark.
const adobe = (letters) =>
  `<rect x="1.5" y="2.5" width="21" height="19" rx="4.5" stroke="currentColor" stroke-width="1.8"/>` +
  text('sans', letters, 12, 16.4, 10.5, { anchor: 'middle', fill: 'currentColor' });
const icon = (slug) => `<path d="${si[slug].path}" fill="currentColor"/>`;

// Legends for the utility keys (drawn, since Geist has no ⌫ / ⏎ glyphs).
const GLYPHS = {
  back: '<path d="M8 5h12a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 20 19H8l-6-7z M11 9l6 6M17 9l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>',
  enter: '<path d="M20 5v6.5a2 2 0 0 1-2 2H5 M9 9.5l-4 4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>',
};

// `fav` marks the daily-driver stack (small LED on the keycap).
const K = (name, ic, hex, fav = false) => ({ name, ic, hex, fav });
const ROWS = [
  [
    { mod: 'LANG', w: 1.5, accent: 'violet' },
    K('TypeScript', icon('siTypescript'), '#3178C6'),
    K('JavaScript', icon('siJavascript'), '#F7DF1E'),
    K('Python', icon('siPython'), '#3776AB', true),
    K('Go', icon('siGo'), '#00ADD8'),
    K('C', icon('siC'), '#A8B9CC'),
    K('C++', icon('siCplusplus'), '#00599C'),
    K('R', icon('siR'), '#276DC3'),
    K('PHP', icon('siPhp'), '#777BB4'),
    K('HTML5', icon('siHtml5'), '#E34F26'),
    K('CSS', icon('siCss'), '#663399'),
    K('Markdown', icon('siMarkdown'), null),
    { mod: 'back', glyph: true, w: 1.5 },
  ],
  [
    { mod: 'FRONT', w: 2, accent: 'cyan' },
    K('Next.js', icon('siNextdotjs'), null, true),
    K('React', icon('siReact'), '#61DAFB'),
    K('Tailwind CSS', icon('siTailwindcss'), '#06B6D4', true),
    K('shadcn/ui', icon('siShadcnui'), null, true),
    K('Vite', icon('siVite'), '#9135FF'),
    K('Sass', icon('siSass'), '#CC6699'),
    K('Three.js', icon('siThreedotjs'), null),
    K('GSAP', icon('siGreensock'), '#88CE02'),
    K('p5.js', icon('siP5dotjs'), '#ED225D'),
    K('Chart.js', icon('siChartdotjs'), '#FF6384'),
    K('Bootstrap', icon('siBootstrap'), '#7952B3'),
    K('Chakra UI', icon('siChakraui'), '#1BB2A9'),
  ],
  [
    { mod: 'BACK', w: 1.75, accent: 'emerald' },
    K('PostgreSQL', icon('siPostgresql'), '#4169E1', true),
    K('Neon', icon('siNeon'), '#34D59A', true),
    K('Redis', icon('siRedis'), '#FF4438', true),
    K('Node.js', icon('siNodedotjs'), '#5FA04E'),
    K('Express', icon('siExpress'), null),
    K('Git', icon('siGit'), '#F03C2E'),
    K('GitHub', icon('siGithub'), null),
    K('npm', icon('siNpm'), '#CB3837'),
    K('RStudio', icon('siRstudioide'), '#75AADB'),
    K('Electron', icon('siElectron'), '#47848F'),
    K('OVH', icon('siOvh'), '#123F6D'),
    { mod: 'enter', glyph: true, w: 1.25 },
  ],
  [
    { mod: 'DESIGN', w: 2.25, accent: 'rose' },
    K('Figma', icon('siFigma'), '#F24E1E'),
    K('Photoshop', adobe('Ps'), '#31A8FF'),
    K('Lightroom', adobe('Lr'), '#31A8FF'),
    K('Premiere Pro', adobe('Pr'), '#9999FF'),
    K('Blender', icon('siBlender'), '#E87D0D'),
    K('Dribbble', icon('siDribbble'), '#EA4C89'),
    K('WordPress', icon('siWordpress'), '#21759B'),
    K('Webflow', icon('siWebflow'), '#146EF5'),
    { mod: 'hugodelacour.com', w: 3.75, space: true },
  ],
];

// Deterministic shuffle so the typing order looks random but stays stable.
function shuffle(list, seed = 42) {
  const a = list.slice();
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function stack(themeName) {
  const T = THEMES[themeName];
  const dark = themeName === 'dark';
  const iso = makeIso(50, 105, 456);

  const KEY = dark
    ? { top: '#262d36', left: '#1b2129', right: '#151a21', edge: '#353e4a', ink: '#c9d1d9' }
    : { top: '#ffffff', left: '#eef1f4', right: '#dde3e9', edge: '#d0d7de', ink: '#57606a' };
  const CASE = dark
    ? { top: '#161b22', left: '#11151b', right: '#0b0e13', plate: '#0d1117', edge: '#2a313b' }
    : { top: '#f6f8fa', left: '#e6eaef', right: '#d6dce3', plate: '#e9edf1', edge: '#d0d7de' };

  // Keyboard local (col, row) → world: col runs along -y (rising to the right), row along +x.
  const G = 0.06; // gap
  const I = 0.1; // keycap top inset
  const Z0 = 0.5; // plate height
  const Z1 = Z0 + 0.34; // keycap top

  const out = [];
  const pt = (x, y, z) => iso.p(x, y, z).map(r).join(',');
  const poly = (list, fill, extra = '') => `<polygon points="${list.map((v) => pt(...v)).join(' ')}" fill="${fill}"${extra}/>`;

  // ---- Case -------------------------------------------------------------
  const cx0 = -0.32, cx1 = 4.32, cy0 = -14.32, cy1 = 0.32;
  const cs = ` stroke="${CASE.edge}" stroke-width="1" stroke-linejoin="round"`;
  out.push(`<polygon points="${[[cx0, cy0, 0], [cx1, cy0, 0], [cx1, cy1, 0], [cx0, cy1, 0]].map((v) => pt(v[0] + 0.25, v[1] + 0.25, -0.35)).join(' ')}" fill="${T.shadow}" filter="url(#soft)"/>`);
  out.push(poly([[cx0, cy1, 0], [cx1, cy1, 0], [cx1, cy1, Z0], [cx0, cy1, Z0]], CASE.left, cs));
  out.push(poly([[cx1, cy0, 0], [cx1, cy1, 0], [cx1, cy1, Z0], [cx1, cy0, Z0]], CASE.right, cs));
  out.push(poly([[cx0, cy0, Z0], [cx1, cy0, Z0], [cx1, cy1, Z0], [cx0, cy1, Z0]], CASE.top, cs));
  out.push(poly([[-0.08, -14.08, Z0], [4.08, -14.08, Z0], [4.08, 0.08, Z0], [-0.08, 0.08, Z0]], CASE.plate));
  // Status LED on the case
  const led = iso.p(cx0 + 0.16, -13.6, Z0);
  out.push(`<ellipse class="led" cx="${r(led[0])}" cy="${r(led[1])}" rx="5" ry="2.9" fill="${ACCENTS.emerald[1]}"/>`);

  // Timeline: one key every STEP seconds, in a shuffled order.
  const typed = ROWS.flat().filter((k) => k.name);
  const STEP = 0.9;
  const CYCLE = typed.length * STEP;
  const order = shuffle(typed.map((_, i) => i));
  const delay = new Map(order.map((ki, slot) => [typed[ki], r(0.6 + slot * STEP)]));

  // Each logo is defined once and instanced with <use>.
  const iconId = (k) => 'i-' + k.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const symbols = typed.map((k) => `<g id="${iconId(k)}">${k.ic}</g>`).join('');

  // ---- Keys ---------------------------------------------------------------
  ROWS.forEach((row, ri) => {
    let c = 0;
    const keys = row.map((k) => {
      const w = k.w ?? 1;
      const key = { ...k, src: k, c, w, r: ri };
      c += w;
      return key;
    });
    // Painter's order inside a row: right (farther) to left (closer).
    keys.reverse().forEach((k) => {
      const X0 = k.r + G, X1 = k.r + 1 - G;
      const Y0 = -(k.c + k.w) + G, Y1 = -k.c - G;
      let faces = KEY;
      if (k.accent) {
        const [t, l, rr] = ACCENTS[k.accent];
        faces = dark
          ? { top: mix(t, '#0d1117', 0.12), left: mix(l, '#0d1117', 0.3), right: mix(rr, '#0d1117', 0.25), edge: mix(t, '#ffffff', 0.15), ink: '#ffffff' }
          : { top: l, left: rr, right: mix(rr, '#000000', 0.2), edge: mix(l, '#000000', 0.08), ink: '#ffffff' };
      }
      const st = ` stroke="${faces.edge}" stroke-width="0.8" stroke-linejoin="round"`;
      const top = [[X0 + I, Y0 + I, Z1], [X1 - I, Y0 + I, Z1], [X1 - I, Y1 - I, Z1], [X0 + I, Y1 - I, Z1]];
      const parts = [
        poly([[X0, Y1, Z0], [X1, Y1, Z0], [X1 - I, Y1 - I, Z1], [X0 + I, Y1 - I, Z1]], faces.left, st),
        poly([[X1, Y0, Z0], [X1, Y1, Z0], [X1 - I, Y1 - I, Z1], [X1 - I, Y0 + I, Z1]], faces.right, st),
        poly(top, faces.top, st),
      ];

      // Legend lives on the top face: u reads along the row (-y), v points to the front (+x).
      const fw = Y1 - Y0 - 2 * I; // face width along u
      const fh = X1 - X0 - 2 * I; // face depth along v
      const M = (k2) => iso.planeMatrix(X0 + I, Y1 - I, Z1, [0, -1, 0], [1, 0, 0], k2);

      if (k.glyph) {
        const S = 0.36;
        parts.push(`<g transform="${M(1)} translate(${r(fw - S - 0.1)} ${r((fh - S) / 2)}) scale(${S / 24})" color="${KEY.ink}">${GLYPHS[k.mod]}</g>`);
        out.push(`<g>${parts.join('')}</g>`);
        return;
      }
      if (k.mod) {
        const size = k.space ? 0.17 : 0.19;
        const tx = k.space ? fw / 2 : 0.1;
        const ty = k.space ? fh / 2 + size * 0.36 : 0.3;
        parts.push(`<g transform="${M(0.01)}">${text('mono', k.mod, tx * 100, ty * 100, size * 100, { anchor: k.space ? 'middle' : 'start', fill: k.accent ? faces.ink : KEY.ink, tracking: 1.2 })}</g>`);
        out.push(`<g>${parts.join('')}</g>`);
        return;
      }

      // Brand flash overlay + logo
      const flash = k.hex && luminance(k.hex) > 0.02 ? k.hex : dark ? '#e6edf3' : '#1f2328';
      const onFlash = luminance(flash) > 0.45 ? '#0d1117' : '#ffffff';
      const S = 0.46; // logo size in world units
      const logo = (color) =>
        `<use href="#${iconId(k)}" transform="${M(1)} translate(${r((fw - S) / 2)} ${r((fh - S) / 2)}) scale(${r((S / 24) * 10000) / 10000})" color="${color}"/>`;
      const d = delay.get(k.src);
      parts.push(logo(KEY.ink));
      if (k.fav) {
        const [ex, ey] = iso.p(X1 - I - 0.1, Y0 + I + 0.1, Z1);
        parts.push(`<ellipse cx="${r(ex)}" cy="${r(ey)}" rx="4.6" ry="2.7" fill="${ACCENTS.amber[1]}"/><ellipse cx="${r(ex)}" cy="${r(ey)}" rx="9" ry="5.2" fill="${ACCENTS.amber[1]}" opacity="0.22"/>`);
      }
      parts.push(`<g class="fl" style="animation-delay:${d}s">${poly(top, flash)}${logo(onFlash)}</g>`);
      out.push(`<g class="key" style="animation-delay:${d}s">${parts.join('')}</g>`);
    });
  });

  // ---- Copy -------------------------------------------------------------
  const copy = [];
  copy.push(text('mono', 'STACK', 40, 52, 13, { tracking: 1.8, fill: T.muted }));
  copy.push(text('sans', 'Tools of the trade', 38, 94, 36, { tracking: -1, fill: T.text }));
  copy.push(text('regular', `${typed.length} keys: the languages, frameworks and tools`, 40, 126, 17, { fill: T.muted }));
  copy.push(text('regular', 'I build with, on one keyboard.', 40, 149, 17, { fill: T.muted }));
  let lx = 40;
  for (const [name, acc] of [['Languages', 'violet'], ['Frontend', 'cyan'], ['Back & data', 'emerald'], ['Design', 'rose']]) {
    copy.push(`<rect x="${lx}" y="172" width="10" height="10" rx="2.5" fill="${ACCENTS[acc][1]}"/>`);
    copy.push(text('mono', name, lx + 17, 181.5, 12, { fill: T.muted }));
    lx += measure('mono', name, 12) + 36;
  }
  copy.push(`<circle cx="45" cy="206" r="3.5" fill="${ACCENTS.amber[1]}"/><circle class="led" cx="45" cy="206" r="7" fill="${ACCENTS.amber[1]}" opacity="0.25"/>`);
  copy.push(text('mono', 'Daily drivers', 57, 210, 12, { fill: T.muted }));

  // "Now typing" caption synced with the keys.
  const capX = 640, capY = 528;
  copy.push(text('mono', 'NOW TYPING', capX, capY - 30, 12, { tracking: 1.8, fill: T.faint }));
  copy.push(text('mono', '›', capX, capY, 20, { fill: ACCENTS.emerald[1] }));
  const caps = glyphSet('mono', 20, 'c');
  typed.forEach((k) => {
    copy.push(caps.text(k.name, capX + 22, capY, { fill: T.text, attrs: `class="cap" style="animation-delay:${delay.get(k)}s"` }));
  });
  copy.push(`<rect class="caret" x="${capX + 22}" y="${capY - 17}" width="10" height="21" fill="${T.muted}"/>`);

  const pct = (sec) => `${r((sec / CYCLE) * 100 * 1000) / 1000}%`;
  // Caret slides to the end of the current word.
  const caretFrames = order
    .map((ki, slot) => {
      const wpx = typed[ki].name.length * 12 + 6;
      const t0 = slot * STEP;
      return `${pct(t0)},${pct(t0 + STEP - 0.01)} { transform: translateX(${wpx}px); }`;
    })
    .join('\n');

  const style = `
.key { animation: press ${r(CYCLE)}s infinite; }
@keyframes press { 0% { transform: none; } ${pct(0.08)} { transform: translateY(3.5px); } ${pct(0.32)} { transform: translateY(3.5px); } ${pct(0.5)}, 100% { transform: none; } }
.fl { opacity: 0; animation: flash ${r(CYCLE)}s infinite; }
@keyframes flash { 0% { opacity: 0; } ${pct(0.06)} { opacity: 1; } ${pct(0.7)} { opacity: 1; } ${pct(1.6)}, 100% { opacity: 0; } }
.cap { opacity: 0; animation: cap ${r(CYCLE)}s infinite; }
@keyframes cap { 0% { opacity: 0; } ${pct(0.02)} { opacity: 1; } ${pct(STEP - 0.04)} { opacity: 1; } ${pct(STEP)}, 100% { opacity: 0; } }
.caret { animation: caret ${r(CYCLE)}s steps(1) 0.6s infinite, blink 1s steps(1) infinite; }
@keyframes caret { ${caretFrames} }
@keyframes blink { 50% { opacity: 0; } }
.led { animation: blink 2.4s steps(1) infinite; }
.board { animation: rise 1s cubic-bezier(.2,.7,.2,1) both; }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }`;

  const defs = `<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>${symbols}${caps.defs()}`;

  return svgDoc({
    width: W,
    height: H,
    title: 'Tech stack',
    desc: `An isometric mechanical keyboard whose keys are the tools Hugo uses: ${ROWS.map((row) => row.filter((k) => k.name).map((k) => k.name).join(', ')).join('; ')}.`,
    style,
    defs,
    body: `<g class="board">${out.join('\n')}</g>\n${copy.join('\n')}`,
  });
}
