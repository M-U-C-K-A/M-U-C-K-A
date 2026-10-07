// Shared helpers for the isometric SVG generators.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;

export const r = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// Themes — neutrals follow GitHub's own palette so the art sits on the page.
// ---------------------------------------------------------------------------
export const THEMES = {
  dark: {
    name: 'dark',
    text: '#e6edf3',
    muted: '#8b949e',
    faint: '#484f58',
    line: '#30363d',
    top: '#1c2129',
    left: '#151a21',
    right: '#10141a',
    edge: '#2f3742',
    edgeHi: '#3d4652',
    base: { top: '#161b22', left: '#11151b', right: '#0c1015' },
    empty: { top: '#1f252d', left: '#181d24', right: '#13171d' },
    shadow: 'rgba(0,0,0,0.45)',
    ink: '#e6edf3',
  },
  light: {
    name: 'light',
    text: '#1f2328',
    muted: '#656d76',
    faint: '#afb8c1',
    line: '#d0d7de',
    top: '#ffffff',
    left: '#eef1f4',
    right: '#e0e5ea',
    edge: '#d0d7de',
    edgeHi: '#e4e8ec',
    base: { top: '#f6f8fa', left: '#e6eaef', right: '#d8dee4' },
    empty: { top: '#eef1f4', left: '#e1e6eb', right: '#d4dae0' },
    shadow: 'rgba(31,35,40,0.12)',
    ink: '#1f2328',
  },
};

// Accent ramps: [top, left, right] faces, lit from the top-left.
export const ACCENTS = {
  violet: ['#a78bfa', '#8b5cf6', '#6d28d9'],
  cyan: ['#67e8f9', '#22d3ee', '#0e7490'],
  emerald: ['#6ee7b7', '#34d399', '#047857'],
  amber: ['#fcd34d', '#f59e0b', '#b45309'],
  rose: ['#fda4af', '#fb7185', '#be123c'],
  blue: ['#93c5fd', '#3b82f6', '#1d4ed8'],
};

// ---------------------------------------------------------------------------
// Colour utilities
// ---------------------------------------------------------------------------
export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex([R, G, B]) {
  return '#' + [R, G, B].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A.map((v, i) => v + (B[i] - v) * t));
}
export function luminance(hex) {
  const [R, G, B] = hexToRgb(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
// Three shaded faces from one brand colour.
export function shade(hex) {
  return [mix(hex, '#ffffff', 0.18), hex, mix(hex, '#000000', 0.32)];
}

// ---------------------------------------------------------------------------
// Isometric projection (true isometric, 30°). x → right-down, y → left-down, z → up.
// ---------------------------------------------------------------------------
export function makeIso(s, ox, oy) {
  const p = (x, y, z = 0) => [ox + (x - y) * COS * s, oy + (x + y) * SIN * s - z * s];
  const pts = (list) => list.map(([x, y, z]) => p(x, y, z).map(r).join(',')).join(' ');
  // Affine maps from a face's local 2D coordinates (in world units) to screen.
  const m = (a, b, c, d, [e, f]) => `matrix(${[a, b, c, d, e, f].map((v) => r(v * 1000) / 1000).join(' ')})`;
  return {
    s,
    p,
    pts,
    // Horizontal plane at height z: local u → +x, v → +y.
    topMatrix: (x, y, z, k = 1) => m(COS * s * k, SIN * s * k, -COS * s * k, SIN * s * k, p(x, y, z)),
    // Face facing +y (the visible "left" face): u → +x, v → -z (down the face).
    leftMatrix: (x, y, z, k = 1) => m(COS * s * k, SIN * s * k, 0, s * k, p(x, y, z)),
    // Face facing +x (the visible "right" face): u → -y, v → -z.
    rightMatrix: (x, y, z, k = 1) => m(COS * s * k, -SIN * s * k, 0, s * k, p(x, y, z)),
    // Generic plane: local u, v map onto the world vectors U, V.
    planeMatrix: (x, y, z, U, V, k = 1) => {
      const d = ([dx, dy, dz]) => [(dx - dy) * COS * s * k, ((dx + dy) * SIN - dz) * s * k];
      const [a, b] = d(U), [c, e] = d(V);
      return m(a, b, c, e, p(x, y, z));
    },
  };
}

// A box as three polygons. `faces` = { top, left, right }, plus optional stroke.
export function box(iso, { x, y, z = 0, w, d, h }, faces, { stroke, sw = 1, extra = '' } = {}) {
  const st = stroke ? ` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"` : '';
  const top = iso.pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]);
  const left = iso.pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]);
  const right = iso.pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]);
  return (
    `<polygon points="${left}" fill="${faces.left}"${st}/>` +
    `<polygon points="${right}" fill="${faces.right}"${st}/>` +
    `<polygon points="${top}" fill="${faces.top}"${st}${extra}/>`
  );
}

// Flat quad on a horizontal plane.
export function quad(iso, { x, y, z = 0, w, d }, attrs) {
  return `<polygon points="${iso.pts([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]])}" ${attrs}/>`;
}

// ---------------------------------------------------------------------------
// Text → outlined paths, so the art renders identically everywhere
// (images on GitHub cannot load web fonts).
// ---------------------------------------------------------------------------
const fontCache = {};
export function font(name) {
  const files = { sans: 'Geist-SemiBold.ttf', regular: 'Geist-Regular.ttf', mono: 'GeistMono-Medium.ttf' };
  if (!fontCache[name]) {
    const buf = fs.readFileSync(path.join(here, '..', 'fonts', files[name]));
    fontCache[name] = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return fontCache[name];
}

// opentype.js' own toPathData() occasionally emits NaN, so serialise ourselves.
function pathData(p) {
  const n = (v) => String(r(v));
  return p.commands
    .map((c) => {
      if (c.type === 'M' || c.type === 'L') return c.type + n(c.x) + ' ' + n(c.y);
      if (c.type === 'Q') return 'Q' + [c.x1, c.y1, c.x, c.y].map(n).join(' ');
      if (c.type === 'C') return 'C' + [c.x1, c.y1, c.x2, c.y2, c.x, c.y].map(n).join(' ');
      return 'Z';
    })
    .join('');
}

// One glyph per character: no ligatures (Geist ships a few surprising ones).
const glyphsOf = (f, str) => Array.from(str).map((ch) => f.charToGlyph(ch));

export function measure(fontName, text, size, tracking = 0) {
  const f = font(fontName);
  const glyphs = glyphsOf(f, text);
  const scale = size / f.unitsPerEm;
  let w = 0;
  glyphs.forEach((g, i) => {
    w += g.advanceWidth * scale;
    if (i < glyphs.length - 1) w += f.getKerningValue(g, glyphs[i + 1]) * scale + tracking;
  });
  return w;
}

// Returns a <path> string. `anchor`: start | middle | end. `tracking` in px.
export function text(fontName, str, x, y, size, { anchor = 'start', tracking = 0, fill = 'currentColor', attrs = '' } = {}) {
  const f = font(fontName);
  const width = measure(fontName, str, size, tracking);
  let cx = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  const glyphs = glyphsOf(f, str);
  const scale = size / f.unitsPerEm;
  let d = '';
  glyphs.forEach((g, i) => {
    d += pathData(g.getPath(cx, y, size));
    cx += g.advanceWidth * scale;
    if (i < glyphs.length - 1) cx += f.getKerningValue(g, glyphs[i + 1]) * scale + tracking;
  });
  return `<path d="${d}" fill="${fill}"${attrs ? ' ' + attrs : ''}/>`;
}

// ---------------------------------------------------------------------------
// SVG document wrapper
// ---------------------------------------------------------------------------
export function svgDoc({ width, height, title, desc, style = '', defs = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" role="img" aria-labelledby="t d">
<title id="t">${title}</title>
<desc id="d">${desc}</desc>
<style>${style}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; } }</style>
<defs>${defs}</defs>
${body}
</svg>
`;
}

// Text built from <use>-instanced glyphs: each glyph outline is stored once.
// Handy when many labels share a font and size (e.g. animated captions).
export function glyphSet(fontName, size, prefix = 'g') {
  const f = font(fontName);
  const scale = size / f.unitsPerEm;
  const used = new Map();
  const idOf = (g) => {
    if (!used.has(g.index)) used.set(g.index, { id: `${prefix}${g.index}`, d: pathData(g.getPath(0, 0, size)) });
    return used.get(g.index).id;
  };
  return {
    text(str, x, y, { anchor = 'start', fill = 'currentColor', attrs = '' } = {}) {
      const glyphs = glyphsOf(f, str);
      const width = measure(fontName, str, size);
      let cx = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
      const uses = glyphs.map((g, i) => {
        const u = g.unicode === 32 ? '' : `<use href="#${idOf(g)}" x="${r(cx)}" y="${r(y)}"/>`;
        cx += g.advanceWidth * scale + (i < glyphs.length - 1 ? f.getKerningValue(g, glyphs[i + 1]) * scale : 0);
        return u;
      });
      return `<g fill="${fill}"${attrs ? ' ' + attrs : ''}>${uses.join('')}</g>`;
    },
    defs: () => [...used.values()].map(({ id, d }) => `<path id="${id}" d="${d}"/>`).join(''),
  };
}
