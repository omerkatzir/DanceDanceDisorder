import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const site = resolve(root, '.pages-site');
const dist = resolve(root, 'web-prototype/dist');
const html = await readFile(resolve(dist, 'index.html'), 'utf8');
if (html.includes('/src/main.ts') || !html.includes('./assets/')) {
  throw new Error('Build the prototype with relative asset paths before staging Pages.');
}
// Only the disposable deployment directory is replaced; source/Unity export stay intact.
await rm(site, { recursive: true, force: true });
await mkdir(site, { recursive: true });
await cp(resolve(root, 'index.html'), resolve(site, 'index.html'));
await cp(resolve(root, 'Build'), resolve(site, 'Build'), { recursive: true });
await cp(dist, resolve(site, 'web-prototype'), { recursive: true });
await writeFile(resolve(site, '.nojekyll'), '');
console.log('Pages staged: original Unity at /, built prototype at /web-prototype/.');
