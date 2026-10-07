// Builds the static SVGs committed under /assets.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hero } from './hero.mjs';
import { stack } from './stack.mjs';
import { LINKS, linkButton } from './links.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');
fs.mkdirSync(root, { recursive: true });

for (const theme of ['dark', 'light']) {
  const files = { [`hero-${theme}.svg`]: hero(theme), [`stack-${theme}.svg`]: stack(theme) };
  for (const link of LINKS) files[`link-${link.id}-${theme}.svg`] = linkButton(link, theme);
  for (const [name, svg] of Object.entries(files)) {
    fs.writeFileSync(path.join(root, name), svg);
    console.log(`${name.padEnd(22)} ${(svg.length / 1024).toFixed(1)} kB`);
  }
}
