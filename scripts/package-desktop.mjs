import { copyFile, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version;
const bundleDir = path.join(rootDir, 'src-tauri', 'target', 'release', 'bundle');
const releaseDir = path.join(rootDir, 'release');
const platformName = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux';
const archName = process.arch === 'x64' ? 'x64' : process.arch;
const supportedExtensions = new Set(['.msi', '.exe', '.dmg', '.AppImage']);

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
      continue;
    }

    const extension = path.extname(entry.name);
    if (entry.isFile() && supportedExtensions.has(extension)) {
      files.push(absolutePath);
    }
  }

  return files;
};

const bundleFiles = await collectFiles(bundleDir).catch(() => []);
if (bundleFiles.length === 0) {
  throw new Error(`No desktop installer files found under ${bundleDir}`);
}

await mkdir(releaseDir, { recursive: true });
const existingReleaseFiles = await readdir(releaseDir).catch(() => []);
await Promise.all(
  existingReleaseFiles
    .filter((fileName) => fileName.startsWith('Toodo-desktop-'))
    .map((fileName) => rm(path.join(releaseDir, fileName), { force: true })),
);
await copyFile(path.join(rootDir, 'README_DESKTOP_USER.txt'), path.join(releaseDir, 'README_DESKTOP_USER.txt')).catch(() => {});
let copiedCount = 0;
for (const source of bundleFiles) {
  const extension = path.extname(source);
  const lowerExtension = extension.toLowerCase();

  if (platformName === 'windows' && lowerExtension === '.msi') {
    console.log(`Skipping Windows MSI for preview release: ${source}`);
    continue;
  }

  const installerKind =
    platformName === 'windows' && lowerExtension === '.exe'
      ? 'user-nsis'
      : lowerExtension === '.msi'
        ? 'msi'
        : lowerExtension === '.exe'
          ? 'setup'
          : extension.slice(1);
  const targetName = `Toodo-desktop-${platformName}-${archName}-v${version}-${installerKind}${extension}`;
  const target = path.join(releaseDir, targetName);
  await copyFile(source, target);
  copiedCount += 1;
  console.log(`Desktop installer copied: ${target}`);
}

if (copiedCount === 0) {
  throw new Error(`No releasable desktop installer files were copied from ${bundleDir}`);
}
