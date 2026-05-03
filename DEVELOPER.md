# Toodo Developer Guide

이 문서는 Toodo를 개발하거나 portable/desktop release를 생성하는 개발자용 안내입니다.

## 개발 환경

공통:

- Node.js 20 이상 권장
- npm
- Chrome 또는 Edge

Desktop 빌드:

- Rust stable toolchain
- Tauri 2.x CLI (`@tauri-apps/cli`)
- Windows installer 빌드 시 Windows 환경 권장

현재 npm 패키지:

- `@tauri-apps/api`
- `@tauri-apps/cli`
- React
- Vite
- TypeScript

## 설치

```bash
npm install
```

## 브라우저 개발 서버

```bash
npm run dev
```

## Desktop 개발 실행

```bash
npm run dev:desktop
```

Tauri가 Vite dev server를 실행하고 desktop WebView를 띄웁니다.

## 브라우저 프로덕션 빌드

```bash
npm run build
```

## Portable HTML 빌드

```bash
npm run build:portable
```

결과:

```text
release/
  Toodo/
    index.html
    README_USER.txt
```

## Portable zip 생성

```bash
npm run package:portable
```

결과:

```text
release/
  Toodo-portable.zip
```

zip 내부 구조:

```text
Toodo/
  index.html
  README_USER.txt
```

## Desktop installer 빌드

```bash
npm run build:desktop
```

Release asset용 파일명으로 복사하려면:

```bash
npm run package:desktop
```

결과 예시:

```text
release/
  Toodo-desktop-windows-x64-v0.2.0-setup.exe
  Toodo-desktop-windows-x64-v0.2.0-msi.msi
```

Rust toolchain이 설치되어 있지 않으면 desktop 빌드는 실패합니다. 일반 사용자는 Rust나 Node.js가 필요하지 않고, Release의 installer만 다운로드하면 됩니다.

## Tauri 구조

```text
src-tauri/
  Cargo.toml
  build.rs
  tauri.conf.json
  capabilities/
    default.json
  src/
    main.rs
```

Tauri 설정:

- `beforeDevCommand`: `npm run dev -- --host 127.0.0.1`
- `devUrl`: `http://127.0.0.1:5173`
- `beforeBuildCommand`: `npm run build`
- `frontendDist`: `../dist`
- Windows bundle target: `nsis`, `msi`

## Storage adapter 구조

React 컴포넌트는 브라우저 저장소나 Tauri API를 직접 다루지 않습니다.

```text
src/storage/
  appStorage.ts
  indexedDbStorage.ts
  localStorageFallback.ts
  desktopFileStorage.ts
  types.ts
```

Adapter:

- Browser: IndexedDB 우선, 실패 시 localStorage fallback
- Desktop: Tauri command를 통한 JSON file storage

Runtime 감지:

- Tauri runtime이면 `desktopFileStorage`
- 브라우저/portable이면 `indexedDbStorage` 또는 `localStorageFallback`

## Desktop file storage 구조

Desktop 버전은 OS app data directory 아래에 실제 JSON 파일을 저장합니다.

```text
ToodoData/
  meta.json
  years/
    2026.json
    2027.json
  backups/
    2026-20260503-153000.json
```

규칙:

- 앱 시작 시 `meta.json`을 먼저 로드합니다.
- active year에 해당하는 `years/{year}.json`만 로드합니다.
- 연도 전환 시 현재 연도를 저장한 뒤 다음 연도 JSON을 로드합니다.
- Task, TaskDailyMemo, ProjectExclusion은 현재 active year JSON에만 저장됩니다.

## Desktop Tauri commands

`src-tauri/src/main.rs`에 다음 command가 있습니다.

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

JSON 저장은 임시 파일에 먼저 쓴 뒤 기존 파일을 교체하는 방식으로 파일 손상 가능성을 줄입니다.

## 데이터 마이그레이션

누락 필드는 앱 storage normalization에서 보정합니다.

- `Task.scheduleCertainty`: `fixed`
- `YearlyWorkspaceData.projectExclusions`: `[]`
- `createdAt`: 없으면 `updatedAt` 또는 현재 시각

Portable에서 Desktop으로 옮길 때는 Portable 앱에서 `Export All` 후 Desktop 앱에서 `Import All`을 사용합니다.

## GitHub Release

수동 portable release:

```bash
npm run package:portable
```

수동 desktop release:

```bash
npm run package:desktop
```

GitHub Actions:

`.github/workflows/release.yml`은 `v*` tag가 push되면 다음을 시도합니다.

- Ubuntu에서 portable zip 생성 및 업로드
- Windows에서 desktop installer 생성 및 업로드
- signing secret이 없으면 unsigned preview build로 진행

예:

```bash
git tag v0.2.0-desktop-preview
git push origin v0.2.0-desktop-preview
```

## Code signing

Windows/macOS signing 준비는 [SIGNING.md](./SIGNING.md)를 참고하세요.
