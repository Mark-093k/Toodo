# Toodo Developer Guide

This document is for developers who want to run, build, or package Toodo.

The public README is intentionally user-focused. Keep detailed developer commands here.

## Requirements

Common requirements:

- Node.js 20 or newer
- npm
- Chrome or Edge for manual browser checks

Desktop build requirements:

- Rust stable toolchain
- Tauri 2.x CLI through `@tauri-apps/cli`
- Windows for Windows installer builds

## Install

```bash
npm install
```

## Browser Development

```bash
npm run dev
```

## Production Browser Build

```bash
npm run build
```

## Portable HTML Build

```bash
npm run build:portable
npm run package:portable
```

Output:

```text
release/
  Toodo/
    index.html
    README_USER.txt
  Toodo-portable.zip
```

The portable app is designed to work from `file://`.

## Desktop Development

```bash
npm run dev:desktop
```

This starts the Vite dev server and opens the Tauri shell.

`dev:desktop` is a development mode. It is attached to the terminal process so logs are visible. Closing that terminal can close the app.

## Desktop Build

```bash
npm run build:desktop
npm run package:desktop
```

`package:desktop` runs the Tauri build and then copies installer artifacts into `release/`.

Release desktop builds must run without a Windows CMD/console window. This is controlled in `src-tauri/src/main.rs` with:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
```

The `not(debug_assertions)` guard keeps the console available for debug/dev builds while hiding it in release builds.

Expected Windows outputs:

```text
release/
  Toodo-desktop-windows-x64-v<version>-setup.exe
  Toodo-desktop-windows-x64-v<version>-msi.msi
  README_DESKTOP_USER.txt
```

## Project Structure

```text
src/
  components/
  storage/
  store/
  styles/
src-tauri/
  src/main.rs
  tauri.conf.json
scripts/
  build-portable.mjs
  package-portable.mjs
  package-desktop.mjs
  sign-windows.ps1
```

## Storage Architecture

The app uses a storage adapter layer.

- Browser / portable app: IndexedDB first, localStorage fallback.
- Desktop app: Tauri commands backed by JSON files on the local file system.

React code should not directly depend on localStorage or Tauri APIs. Use the storage adapter APIs instead.

## Desktop Data Layout

The desktop app stores data under the OS app data directory:

```text
ToodoData/
  meta.json
  years/
    2026.json
    2027.json
  backups/
```

The app loads `meta.json` first, then only the active year file. This keeps startup work small as more years accumulate.

## Tauri Commands

Implemented in `src-tauri/src/main.rs`:

- `ensure_data_dir`
- `get_data_dir_path`
- `open_data_dir`
- `load_meta`
- `save_meta`
- `list_years`
- `load_year_data`
- `save_year_data`
- `create_year_data`
- `delete_year_data`
- `backup_year_data`
- `export_year_data`
- `import_year_data`

Writes use a temporary file and then replace the target JSON file to reduce the chance of partial writes.

## Release Workflow

The GitHub Actions workflow is in:

```text
.github/workflows/release.yml
```

On tag push, it builds:

- portable zip on Ubuntu
- Windows desktop installer on Windows

Create a preview tag:

```bash
git tag v0.2.0-desktop-preview
git push origin v0.2.0-desktop-preview
```

Do not commit `dist/`, `release/`, `node_modules/`, or signing certificates.

## Signing

See [SIGNING.md](./SIGNING.md).
