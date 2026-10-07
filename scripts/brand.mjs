// GitHub avatar + LinkedIn banner (dark), rendered to PNG with headless Chrome.
//
//   node brand.mjs        → ../brand/avatar.png, ../brand/linkedin-banner.png
//
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { THEMES, ACCENTS, makeIso, box, text, measure, svgDoc, mix, r } from './lib/iso.mjs';
import { scene } from './hero.mjs';

const T = THEMES.dark;
const BG = '#0d1117';

// Faint isometric grid used as a backdrop.
function isoGrid(iso, n, z = 0, color = T.line, opacity = 0.5) {
  let d = '';
  for (let i = -n; i <= n; i++) {
    const [a, b] = [iso.p(i, -n, z), iso.p(i, n, z)];
    const [c, e] = [iso.p(-n, i, z), iso.p(n, i, z)];
    d += `M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}M${r(c[0])} ${r(c[1])}L${r(e[0])} ${r(e[1])}`;
  }
  return `<path d="${d}" stroke="${color}" stroke-width="1" opacity="${opacity}"/>`;
}

// ---------------------------------------------------------------------------
// Avatar: one oversized violet keycap with "HD" on a small dark plate.
// ---------------------------------------------------------------------------
export function avatar() {
  const S = 1000;
  const iso = makeIso(230, 500, 505);
  const out = [];

  out.push(`<rect width="${S}" height="${S}" fill="url(#bg)"/>`);
  out.push(`<g mask="url(#fade)">${isoGrid(makeIso(70, 500, 620), 12, 0, T.line, 0.55)}</g>`);
  out.push(`<ellipse cx="500" cy="590" rx="400" ry="190" fill="url(#glow)"/>`);

  // Plate
  const P = { x: -0.7, y: -0.7, z: 0, w: 1.4, d: 1.4, h: 0.26 };
  out.push(box(iso, P, { top: '#1c2129', left: '#151a21', right: '#0f1318' }, { stroke: '#2f3742', sw: 2 }));
  const led = iso.p(0.55, -0.6, P.h);
  out.push(`<ellipse cx="${r(led[0])}" cy="${r(led[1])}" rx="11" ry="6.4" fill="${ACCENTS.emerald[1]}"/>`);
  out.push(`<ellipse cx="${r(led[0])}" cy="${r(led[1])}" rx="24" ry="14" fill="${ACCENTS.emerald[1]}" opacity="0.2"/>`);

  // Keycap (frustum), same construction as the keyboard keys.
  const X0 = -0.5, X1 = 0.5, Y0 = -0.5, Y1 = 0.5, Z0 = P.h, Z1 = P.h + 0.42, I = 0.12;
  const pt = (x, y, z) => iso.p(x, y, z).map(r).join(',');
  const poly = (list, fill, extra = '') => `<polygon points="${list.map((v) => pt(...v)).join(' ')}" fill="${fill}"${extra}/>`;
  const st = ` stroke="${mix(ACCENTS.violet[0], '#ffffff', 0.2)}" stroke-width="2" stroke-linejoin="round"`;
  out.push(poly([[X0, Y1, Z0], [X1, Y1, Z0], [X1 - I, Y1 - I, Z1], [X0 + I, Y1 - I, Z1]], ACCENTS.violet[1], st));
  out.push(poly([[X1, Y0, Z0], [X1, Y1, Z0], [X1 - I, Y1 - I, Z1], [X1 - I, Y0 + I, Z1]], ACCENTS.violet[2], st));
  out.push(poly([[X0 + I, Y0 + I, Z1], [X1 - I, Y0 + I, Z1], [X1 - I, Y1 - I, Z1], [X0 + I, Y1 - I, Z1]], 'url(#cap)', st));

  // Legend printed on the top face, reading along the row like the keyboard.
  const fw = Y1 - Y0 - 2 * I, fh = X1 - X0 - 2 * I;
  const M = iso.planeMatrix(X0 + I, Y1 - I, Z1, [0, -1, 0], [1, 0, 0], 0.001);
  out.push(`<g transform="${M}">${text('sans', 'HD', (fw / 2) * 1000, (fh / 2 + 0.115) * 1000, 330, { anchor: 'middle', fill: '#ffffff', tracking: -8 })}</g>`);

  // A few satellites
  const cube = (x, y, z, s, acc) => box(iso, { x, y, z, w: s, d: s, h: s }, { top: ACCENTS[acc][0], left: ACCENTS[acc][1], right: ACCENTS[acc][2] });
  out.push(cube(-0.95, -0.25, 1.05, 0.13, 'cyan'));
  out.push(cube(0.15, -1.1, 0.95, 0.11, 'amber'));
  out.push(cube(-0.3, 1.45, 0.7, 0.09, 'rose'));

  return svgDoc({
    width: S,
    height: S,
    title: 'Hugo Delacour',
    desc: 'Avatar: an isometric violet keycap with the initials HD.',
    defs: `
<radialGradient id="bg" cx="0.5" cy="0.45" r="0.7"><stop offset="0" stop-color="#161b22"/><stop offset="1" stop-color="${BG}"/></radialGradient>
<radialGradient id="glow"><stop offset="0" stop-color="${ACCENTS.violet[1]}" stop-opacity="0.35"/><stop offset="1" stop-color="${ACCENTS.violet[1]}" stop-opacity="0"/></radialGradient>
<radialGradient id="fadeG" cx="0.5" cy="0.55" r="0.5"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
<mask id="fade"><rect width="${S}" height="${S}" fill="url(#fadeG)"/></mask>
<linearGradient id="cap" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ACCENTS.violet[0]}"/><stop offset="1" stop-color="${ACCENTS.violet[1]}"/></linearGradient>`,
    body: out.join('\n'),
  });
}

// ---------------------------------------------------------------------------
// LinkedIn banner (1584×396). The profile photo covers the bottom-left,
// so the copy sits in the middle and the illustration on the right.
// ---------------------------------------------------------------------------
export function banner() {
  const W = 1584, H = 396;
  const out = [];
  out.push(`<rect width="${W}" height="${H}" fill="${BG}"/>`);
  out.push(`<g mask="url(#fade)">${isoGrid(makeIso(44, 1000, 120), 30, 0, T.line, 0.6)}</g>`);
  out.push(`<ellipse cx="1370" cy="250" rx="300" ry="130" fill="url(#glow)"/>`);

  // Copy
  const X = 500;
  out.push(`<circle cx="${X + 5}" cy="113" r="5" fill="${ACCENTS.emerald[1]}"/>`);
  out.push(text('mono', 'WEB DEVELOPER  ·  BUT MMI  →  42', X + 20, 118, 14, { tracking: 1.6, fill: T.muted }));
  out.push(text('sans', 'Fast, accessible web products,', X - 2, 178, 44, { tracking: -1.6, fill: T.text }));
  out.push(text('sans', 'from UI/UX to the database.', X - 2, 230, 44, { tracking: -1.6, fill: T.muted }));

  // Stack chips
  let cx = X;
  const chips = [['Next.js', 'violet'], ['Tailwind', 'cyan'], ['shadcn/ui', 'violet'], ['PostgreSQL', 'blue'], ['Neon', 'emerald'], ['Redis', 'rose'], ['Python', 'amber']];
  for (const [label, acc] of chips) {
    const w = measure('mono', label, 13) + 34;
    out.push(`<rect x="${r(cx)}" y="270" width="${r(w)}" height="28" rx="14" fill="#161b22" stroke="${T.line}"/>`);
    out.push(`<circle cx="${r(cx + 14)}" cy="284" r="3.5" fill="${ACCENTS[acc][1]}"/>`);
    out.push(text('mono', label, cx + 24, 289, 13, { fill: T.text }));
    cx += w + 8;
  }
  out.push(text('mono', 'UI/UX  ·  ACCESSIBILITY  ·  SEO', X, 338, 12, { tracking: 1.6, fill: T.faint }));
  out.push(text('mono', 'hugodelacour.com', W - 48, H - 30, 14, { anchor: 'end', tracking: 0.5, fill: ACCENTS.violet[0] }));

  // Illustration (static pose of the README hero scene)
  const sc = scene('dark', makeIso(31, 1370, 128), { still: true });
  out.push(sc.body);

  return svgDoc({
    width: W,
    height: H,
    title: 'Hugo Delacour — LinkedIn banner',
    desc: 'Web developer — fast, accessible web products, from UI/UX to the database.',
    defs: `${sc.defs}
<radialGradient id="glow"><stop offset="0" stop-color="${ACCENTS.violet[1]}" stop-opacity="0.22"/><stop offset="1" stop-color="${ACCENTS.violet[1]}" stop-opacity="0"/></radialGradient>
<linearGradient id="fadeG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset="0.35" stop-color="#444"/><stop offset="1" stop-color="#fff"/></linearGradient>
<mask id="fade"><rect width="${W}" height="${H}" fill="url(#fadeG)"/></mask>`,
    body: out.join('\n'),
  });
}

// ---------------------------------------------------------------------------
function renderPng(svg, width, height, file, scale = 1) {
  const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-'));
  fs.writeFileSync(path.join(tmp, 'img.svg'), svg);
  fs.writeFileSync(path.join(tmp, 'index.html'), `<html><body style="margin:0;background:${BG}"><img src="img.svg" width="${width}" height="${height}" style="display:block"></body></html>`);
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', `--window-size=${width},${height}`, `--force-device-scale-factor=${scale}`, `--screenshot=${file}`, `file://${tmp}/index.html`], { stdio: 'ignore' });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`${path.basename(file).padEnd(22)} ${(fs.statSync(file).size / 1024).toFixed(0)} kB`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'brand');
  fs.mkdirSync(dir, { recursive: true });
  renderPng(avatar(), 1000, 1000, path.join(dir, 'avatar.png'));
  renderPng(banner(), 1584, 396, path.join(dir, 'linkedin-banner.png'), 2);
}
