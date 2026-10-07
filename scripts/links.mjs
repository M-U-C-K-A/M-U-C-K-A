// Contact buttons drawn as keycaps, matching the keyboard. One SVG per link.
import { THEMES, ACCENTS, text, svgDoc, mix } from './lib/iso.mjs';

const W = 220;
const H = 66;

const ICONS = {
  globe:
    '<circle cx="12" cy="12" r="9.2" stroke="currentColor" stroke-width="1.7"/>' +
    '<path d="M2.8 12h18.4M12 2.8c2.6 2.6 3.9 5.6 3.9 9.2s-1.3 6.6-3.9 9.2c-2.6-2.6-3.9-5.6-3.9-9.2S9.4 5.4 12 2.8z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
  linkedin:
    '<rect x="2" y="2" width="20" height="20" rx="4" fill="currentColor"/>' +
    '<path d="M7.2 10v7M7.2 7v.01M11 17v-4.2c0-1.6 1-2.8 2.5-2.8s2.3 1 2.3 2.8V17M11 10v7" stroke="var(--cut)" stroke-width="2" stroke-linecap="round"/>',
  mail:
    '<rect x="2.5" y="4.5" width="19" height="15" rx="3" stroke="currentColor" stroke-width="1.7"/>' +
    '<path d="M3.5 6.5l8.5 6.5 8.5-6.5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>',
  arrow: '<path d="M7 17L17 7M9 7h8v8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
};

export const LINKS = [
  { id: 'portfolio', label: 'Portfolio', icon: 'globe', primary: true, delay: 1.2 },
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', delay: 1.45 },
  { id: 'email', label: 'Email', icon: 'mail', delay: 1.7 },
];

export function linkButton(link, themeName) {
  const T = THEMES[themeName];
  const dark = themeName === 'dark';
  const C = link.primary
    ? { top: 'url(#top)', skirt: ACCENTS.violet[2], edge: mix(ACCENTS.violet[0], '#ffffff', 0.25), ink: '#ffffff', sub: 'rgba(255,255,255,0.75)', cut: ACCENTS.violet[1] }
    : dark
      ? { top: '#262d36', skirt: '#12161c', edge: '#3a4350', ink: T.text, sub: T.muted, cut: '#262d36' }
      : { top: '#ffffff', skirt: '#d0d7de', edge: '#d0d7de', ink: T.text, sub: T.muted, cut: '#ffffff' };

  const icon = (name, x, y, size, color) =>
    `<g transform="translate(${x} ${y}) scale(${size / 24})" color="${color}" fill="none">${ICONS[name].replaceAll('var(--cut)', C.cut)}</g>`;

  const body = `
<rect x="4" y="12" width="${W - 8}" height="${H - 14}" rx="13" fill="${T.shadow}" filter="url(#soft)"/>
<rect x="1" y="8" width="${W - 2}" height="${H - 10}" rx="13" fill="${C.skirt}"/>
<g class="cap">
  <rect x="1" y="1" width="${W - 2}" height="${H - 10}" rx="13" fill="${C.top}" stroke="${C.edge}"/>
  <rect x="14" y="2" width="${W - 28}" height="1" rx="0.5" fill="#ffffff" opacity="${link.primary || dark ? 0.18 : 0}"/>
  ${icon(link.icon, 22, 16, 24, C.ink)}
  ${text('sans', link.label, 58, 35.5, 18, { fill: C.ink, tracking: -0.2 })}
  ${icon('arrow', W - 40, 19, 18, C.sub)}
</g>`;

  const style = `
.cap { animation: press 7s ${link.delay}s infinite; }
@keyframes press { 0%, 6%, 100% { transform: none; } 2%, 3.5% { transform: translateY(5px); } }`;

  return svgDoc({
    width: W,
    height: H,
    title: link.label,
    desc: `${link.label} link button`,
    style,
    defs: `<filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
<linearGradient id="top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ACCENTS.violet[1]}"/><stop offset="1" stop-color="#7c3aed"/></linearGradient>`,
    body,
  });
}
