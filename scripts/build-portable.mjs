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
  `Toodo 사용자 안내

실행 방법
- 이 폴더의 index.html 파일을 더블클릭해서 실행하세요.
- Node.js, npm install, npm run dev가 필요하지 않습니다.
- 권장 브라우저는 Chrome 또는 Edge입니다.

데이터 저장
- 데이터는 현재 브라우저 저장소(IndexedDB, 필요 시 localStorage)에 저장됩니다.
- 이 폴더 안의 파일에 자동으로 저장되는 방식은 아닙니다.
- 브라우저 저장소를 삭제하거나 다른 브라우저/PC로 이동하면 데이터가 보이지 않을 수 있습니다.

백업 / 복원
- 상단의 Export Year 버튼으로 현재 연도 데이터를 JSON 파일로 백업할 수 있습니다.
- Export All 버튼으로 전체 연도 데이터를 JSON 파일로 백업할 수 있습니다.
- 다른 PC로 옮기거나 중요한 작업을 보관하려면 Export 기능으로 백업 파일을 만들어주세요.
- Import Year / Import All 버튼으로 백업 JSON 파일을 다시 가져올 수 있습니다.

주의
- 브라우저 캐시나 사이트 데이터 저장소를 삭제하면 앱 데이터가 사라질 수 있습니다.
- 중요한 데이터는 정기적으로 Export 기능으로 백업해주세요.
`,
  'utf8',
);
await rm(buildDir, { recursive: true, force: true });

console.log(`Portable package created: ${outputHtmlPath}`);
