import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseDir = path.join(rootDir, 'release', 'Toodo');
const buildDir = path.join(releaseDir, '.vite-build');
const sourceHtmlPath = path.join(buildDir, 'index.html');
const outputHtmlPath = path.join(releaseDir, 'index.html');
const userReadmePath = path.join(releaseDir, 'README_USER.txt');

const readBuiltAsset = async (assetPath) => {
  const normalizedPath = assetPath.replace(/^\.\//, '').replace(/^\//, '');
  return readFile(path.join(buildDir, normalizedPath), 'utf8');
};

let html = await readFile(sourceHtmlPath, 'utf8');

for (const match of [...html.matchAll(/<link rel="stylesheet" crossorigin href="([^"]+)">/g)]) {
  const [tag, href] = match;
  const css = await readBuiltAsset(href);
  html = html.replace(tag, () => `<style>\n${css}\n</style>`);
}

for (const match of [...html.matchAll(/<script type="module" crossorigin src="([^"]+)"><\/script>/g)]) {
  const [tag, src] = match;
  const js = await readBuiltAsset(src);
  html = html.replace(tag, () => `<script type="module">\n${js}\n</script>`);
}

await mkdir(releaseDir, { recursive: true });
await writeFile(outputHtmlPath, html, 'utf8');
await writeFile(
  userReadmePath,
  `Toodo Portable User Guide

How to run
- Open index.html by double-clicking it.
- Node.js, npm install, and npm run dev are not required.
- Chrome or Edge is recommended.

Where data is stored
- Portable data is stored in the current browser storage area, using IndexedDB or localStorage.
- Data is not written automatically to files inside this folder.
- If browser storage is cleared, the data can be lost.
- If you open the app in another browser or on another PC, the data will not appear automatically.

Backup and restore
- Export Year saves the current year as a JSON backup file.
- Export All saves all yearly workspaces as one JSON backup file.
- Import Year and Import All restore exported JSON backup files.
- Use Export before moving data to another PC.

Notes
- Keep regular backups for important data.
- The desktop app is recommended for real work data because it stores data as local JSON files.
`,
  'utf8',
);
await rm(buildDir, { recursive: true, force: true });

console.log(`Portable package created: ${outputHtmlPath}`);
