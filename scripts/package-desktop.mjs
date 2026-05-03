import { copyFile, mkdir, readFile, readdir } from 'node:fs/promises';
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
await copyFile(path.join(rootDir, 'README_DESKTOP_USER.txt'), path.join(releaseDir, 'README_DESKTOP_USER.txt')).catch(() => {});
for (const source of bundleFiles) {
  const extension = path.extname(source);
  const installerKind = extension.toLowerCase() === '.msi' ? 'msi' : extension.toLowerCase() === '.exe' ? 'setup' : extension.slice(1);
  const targetName = `Toodo-desktop-${platformName}-${archName}-v${version}-${installerKind}${extension}`;
  const target = path.join(releaseDir, targetName);
  await copyFile(source, target);
  console.log(`Desktop installer copied: ${target}`);
}
