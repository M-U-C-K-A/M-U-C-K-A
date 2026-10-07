// Isometric contribution skyline + stats, regenerated hourly by GitHub Actions.
// Animations are one-shot (bars drop in once) so the image is static afterwards.
//
//   GITHUB_TOKEN=… node activity.mjs <login> <outDir>
//
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEMES, ACCENTS, makeIso, text, measure, svgDoc, shade, r } from './lib/iso.mjs';

const W = 1000;
const H = 620;

const QUERY = `query($login: String!) {
  user(login: $login) {
    followers { totalCount }
    contributionsCollection {
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
    repositories(ownerAffiliations: OWNER, isFork: false, first: 100, orderBy: { field: PUSHED_AT, direction: DESC }) {
      totalCount
      nodes { stargazerCount languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } } }
    }
  }
}`;

export async function fetchData(login, token) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-activity' },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GitHub API: ${JSON.stringify(json.errors ?? json)}`);
  return json.data.user;
}

// ---------------------------------------------------------------------------
export function summarize(user) {
  const cal = user.contributionsCollection.contributionCalendar;
  // weeks[w][weekday], Sunday = 0. The first and last weeks can be partial.
  const weekday = (d) => new Date(d.date + 'T00:00:00Z').getUTCDay();
  const weeks = cal.weeks.map((w) => {
    const slots = Array(7).fill(null);
    w.contributionDays.forEach((d) => (slots[weekday(d)] = d));
    return slots;
  });
  const days = cal.weeks.flatMap((w) => w.contributionDays);

  // Streaks: today with no contribution yet doesn't break the current streak.
  let longest = 0, run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  let current = 0;
  let i = days.length - 1;
  if (days[i]?.contributionCount === 0) i--;
  for (; i >= 0 && days[i].contributionCount > 0; i--) current++;

  const best = days.reduce((a, b) => (b.contributionCount > a.contributionCount ? b : a), days[0]);
  const byWeekday = Array(7).fill(0);
  days.forEach((d) => (byWeekday[weekday(d)] += d.contributionCount));
  const busiest = byWeekday.indexOf(Math.max(...byWeekday));

  const langs = new Map();
  for (const repo of user.repositories.nodes) {
    for (const e of repo.languages.edges) langs.set(e.node.name, (langs.get(e.node.name) ?? 0) + e.size);
  }
  const totalBytes = [...langs.values()].reduce((a, b) => a + b, 0) || 1;
  const top = [...langs.entries()].sort((a, b) => b[1] - a[1]);
  const languages = top.slice(0, 5).map(([name, size]) => ({ name, pct: (size / totalBytes) * 100 }));
  const rest = top.slice(5).reduce((a, [, s]) => a + s, 0);
  if (rest > 0) languages.push({ name: 'Other', pct: (rest / totalBytes) * 100 });

  return {
    weeks,
    total: cal.totalContributions,
    current,
    longest,
    best,
    busiest: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][busiest],
    repos: user.repositories.totalCount,
    stars: user.repositories.nodes.reduce((a, n) => a + n.stargazerCount, 0),
    followers: user.followers.totalCount,
    languages,
  };
}

// ---------------------------------------------------------------------------
export function activity(themeName, S) {
  const T = THEMES[themeName];
  const dark = themeName === 'dark';
  const iso = makeIso(16, 86, 540);
  const out = [];
  const pt = (x, y, z) => iso.p(x, y, z).map(r).join(',');
  const poly = (list, fill, extra = '') => `<polygon points="${list.map((v) => pt(...v)).join(' ')}" fill="${fill}"${extra}/>`;

  const RAMP = dark
    ? ['#155e75', '#0891b2', '#22d3ee', '#818cf8', '#a78bfa']
    : ['#a5f3fc', '#22d3ee', '#0891b2', '#6366f1', '#7c3aed'];
  const nWeeks = S.weeks.length;

  // Height scale: robust to one huge day (95th percentile).
  const counts = S.weeks.flat().filter(Boolean).map((d) => d.contributionCount).filter((c) => c > 0).sort((a, b) => a - b);
  const p95 = counts[Math.floor(counts.length * 0.95)] || 1;
  const level = (c) => (c === 0 ? -1 : Math.min(4, Math.floor((Math.min(c, p95) / p95) * 4.999)));
  const height = (c) => (c === 0 ? 0.08 : 0.35 + 3.4 * Math.sqrt(Math.min(c, p95 * 1.3) / p95));

  // Base slab
  const bx0 = -0.45, bx1 = 7.75, by0 = -nWeeks - 0.45, by1 = 0.45, bz = 0.28;
  const edge = ` stroke="${T.edge}" stroke-width="1" stroke-linejoin="round"`;
  out.push(`<polygon points="${[[bx0, by0], [bx1, by0], [bx1, by1], [bx0, by1]].map(([x, y]) => pt(x + 0.6, y + 0.6, -0.6)).join(' ')}" fill="${T.shadow}" opacity="0.8"/>`);
  out.push(poly([[bx0, by1, 0], [bx1, by1, 0], [bx1, by1, bz], [bx0, by1, bz]], T.base.left, edge));
  out.push(poly([[bx1, by0, 0], [bx1, by1, 0], [bx1, by1, bz], [bx1, by0, bz]], T.base.right, edge));
  out.push(poly([[bx0, by0, bz], [bx1, by0, bz], [bx1, by1, bz], [bx0, by1, bz]], T.base.top, edge));

  // Month labels printed on the slab, along the front edge.
  let lastMonth = null;
  S.weeks.forEach((week, w) => {
    const m = new Date(week.find(Boolean).date + 'T00:00:00Z').toLocaleString('en', { month: 'short', timeZone: 'UTC' });
    if (m !== lastMonth && w < nWeeks - 1) {
      if (lastMonth !== null) {
        const M = iso.planeMatrix(7.0, -w, bz, [0, -1, 0], [1, 0, 0], 0.01);
        out.push(`<g transform="${M}">${text('mono', m.toUpperCase(), 0, 44, 44, { fill: T.muted, tracking: 3 })}</g>`);
      }
      lastMonth = m;
    }
  });

  // Bars, painted back row first, farther (newer) weeks first.
  const G = 0.13;
  const lastDay = S.weeks[nWeeks - 1].findLastIndex(Boolean);
  for (let d = 0; d < 7; d++) {
    for (let w = nWeeks - 1; w >= 0; w--) {
      const day = S.weeks[w][d];
      if (!day) continue;
      const c = day.contributionCount;
      const X0 = d + G, X1 = d + 1 - G, Y0 = -w - 1 + G, Y1 = -w - G;
      const z0 = bz, z1 = bz + height(c);
      const lv = level(c);
      const [top, left, right] = lv < 0 ? [T.empty.top, T.empty.left, T.empty.right] : shade(RAMP[lv]);
      const parts =
        poly([[X0, Y1, z0], [X1, Y1, z0], [X1, Y1, z1], [X0, Y1, z1]], left) +
        poly([[X1, Y0, z0], [X1, Y1, z0], [X1, Y1, z1], [X1, Y0, z1]], right) +
        poly([[X0, Y0, z1], [X1, Y0, z1], [X1, Y1, z1], [X0, Y1, z1]], top);
      const delay = r(0.2 + w * 0.028 + d * 0.012);
      out.push(`<g class="in" style="animation-delay:${delay}s">${parts}</g>`);

      if (w === nWeeks - 1 && d === lastDay) {
        const [tx, ty] = iso.p((X0 + X1) / 2, (Y0 + Y1) / 2, z1);
        out.push(`<g transform="translate(${r(tx)} ${r(ty - 18)})"><circle r="7" fill="${ACCENTS.emerald[1]}" opacity="0.25"/><circle r="4" fill="${ACCENTS.emerald[1]}"/><path d="M0 4V16" stroke="${ACCENTS.emerald[1]}" stroke-width="1.2"/></g>`);
      }
    }
  }

  // ---- Copy: headline + stats (top-left) ---------------------------------
  const copy = [];
  const n = (v) => v.toLocaleString('en-US');
  copy.push(text('mono', 'ACTIVITY', 40, 52, 13, { tracking: 1.8, fill: T.muted }));
  const big = n(S.total);
  copy.push(text('sans', big, 38, 112, 60, { tracking: -2.4, fill: T.text }));
  copy.push(text('regular', 'contributions', 38 + measure('sans', big, 60, -2.4) + 12, 92, 18, { fill: T.text }));
  copy.push(text('regular', 'in the last year', 38 + measure('sans', big, 60, -2.4) + 12, 113, 18, { fill: T.muted }));

  const stats = [
    ['CURRENT STREAK', `${S.current} day${S.current === 1 ? '' : 's'}`],
    ['LONGEST STREAK', `${S.longest} day${S.longest === 1 ? '' : 's'}`],
    ['BEST DAY', `${S.best.contributionCount}`],
    ['BUSIEST', S.busiest.slice(0, 3)],
  ];
  let sx = 40;
  stats.forEach(([label, value]) => {
    const x = sx;
    sx += Math.max(measure('mono', label, 10, 1.2), measure('sans', value, 20, -0.4)) + 34;
    copy.push(`<rect x="${x}" y="146" width="1" height="46" fill="${T.line}"/>`);
    copy.push(text('mono', label, x + 12, 160, 10, { tracking: 1.2, fill: T.muted }));
    copy.push(text('sans', value, x + 12, 186, 20, { fill: T.text, tracking: -0.4 }));
  });
  copy.push(text('mono', `${S.repos} REPOS  ·  ${S.stars} STARS  ·  ${S.followers} FOLLOWERS`, 40, 224, 11, { tracking: 1.4, fill: T.muted }));

  // ---- Languages (bottom-right) ------------------------------------------
  const LX = 600, LY = 476, LW = 360;
  const langColors = [ACCENTS.violet[1], ACCENTS.cyan[1], ACCENTS.emerald[1], ACCENTS.amber[1], ACCENTS.rose[1], T.faint];
  copy.push(text('mono', 'TOP LANGUAGES', LX, LY, 11, { tracking: 1.4, fill: T.muted }));
  let x = LX;
  copy.push(`<clipPath id="bar"><rect x="${LX}" y="${LY + 14}" width="${LW}" height="8" rx="4"/></clipPath>`);
  const segs = [];
  S.languages.forEach((l, i) => {
    const w = (l.pct / 100) * LW;
    segs.push(`<rect x="${r(x)}" y="${LY + 14}" width="${r(Math.max(w - 2, 0.5))}" height="8" fill="${langColors[i]}"/>`);
    x += w;
  });
  copy.push(`<g clip-path="url(#bar)" class="grow">${segs.join('')}</g>`);
  S.languages.forEach((l, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const lx = LX + col * 190, ly = LY + 48 + row * 24;
    copy.push(`<rect x="${lx}" y="${ly - 8.5}" width="9" height="9" rx="2.5" fill="${langColors[i]}"/>`);
    copy.push(text('regular', l.name, lx + 17, ly, 14, { fill: T.text }));
    copy.push(text('mono', `${l.pct.toFixed(1)}%`, lx + 172, ly, 12, { anchor: 'end', fill: T.muted }));
  });

  const updated = new Date().toISOString().slice(0, 10);
  copy.push(text('mono', `UPDATED ${updated}`, W - 40, H - 22, 10, { anchor: 'end', tracking: 1.4, fill: T.faint }));

  const style = `
.in { animation: drop .7s cubic-bezier(.2,.8,.2,1) both; }
@keyframes drop { from { opacity: 0; transform: translateY(-26px); } to { opacity: 1; transform: none; } }
.grow { transform-box: fill-box; transform-origin: left; animation: grow 1.4s .4s cubic-bezier(.2,.8,.2,1) both; }
@keyframes grow { from { transform: scaleX(0); } to { transform: none; } }`;

  return svgDoc({
    width: W,
    height: H,
    title: 'GitHub activity',
    desc: `${S.total} contributions in the last year, shown as an isometric skyline. Current streak ${S.current} days, longest streak ${S.longest} days. Top languages: ${S.languages.map((l) => `${l.name} ${l.pct.toFixed(1)}%`).join(', ')}.`,
    style,
    defs: '',
    body: out.join('\n') + '\n' + copy.join('\n'),
  });
}

// ---------------------------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [login = 'M-U-C-K-A', outDir = 'dist'] = process.argv.slice(2);
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required');
  const S = summarize(await fetchData(login, token));
  fs.mkdirSync(outDir, { recursive: true });
  for (const theme of ['dark', 'light']) {
    const file = path.join(outDir, `activity-${theme}.svg`);
    const svg = activity(theme, S);
    fs.writeFileSync(file, svg);
    console.log(`${file} ${(svg.length / 1024).toFixed(1)} kB`);
  }
}
