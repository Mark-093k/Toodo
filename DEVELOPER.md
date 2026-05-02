# Toodo Developer Guide

이 문서는 Toodo를 개발하거나 portable release를 생성하는 개발자용 안내입니다.

## 개발 환경

- Node.js 20 이상 권장
- npm
- Chrome 또는 Edge

## 설치

```bash
npm install
```

## 개발 서버 실행

```bash
npm run dev
```

Vite가 안내하는 로컬 주소를 브라우저에서 열면 됩니다.

## 프로덕션 빌드

```bash
npm run build
```

TypeScript 검사 후 Vite production build를 생성합니다.

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

`index.html`은 JS/CSS가 인라인된 단일 HTML 파일이며 `file://` 환경에서 실행되도록 Vite `base`는 `./`를 사용합니다.

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

GitHub Release asset에는 `release/Toodo-portable.zip`을 업로드합니다.

## 프로젝트 구조

```text
src/
  App.tsx
  main.tsx
  types.ts
  components/
    MainTable.tsx
    TaskRow.tsx
    GanttView.tsx
    GanttTimeline.tsx
    GanttBar.tsx
    GanttTaskMemoLayer.tsx
    GanttProjectExclusionLayer.tsx
    ProjectExclusionModal.tsx
    ui/
      ThemeSwitcher.tsx
  data/
    sampleTasks.ts
  hooks/
    useTheme.ts
  store/
    workspaceStore.ts
    taskStore.ts
    memoStore.ts
  storage/
    appStorage.ts
    indexedDbStorage.ts
    localStorageFallback.ts
  styles/
    tokens.css
    themes.css
    global.css
  utils/
    date.ts
    projectExclusions.ts
    taskTree.ts
    theme.ts
```

## 저장 구조

Toodo는 IndexedDB를 우선 사용하고, 사용할 수 없는 환경에서는 localStorage fallback을 사용합니다.

현재 schema version:

- App meta: `3`
- Yearly workspace: `3`

localStorage fallback key:

- `toodo:v2:meta`
- `toodo:v2:year:{year}`

IndexedDB:

- DB name: `toodo-db-v2`
- store: `meta`
- store: `yearlyWorkspaces`

## 연도별 데이터 구조

```ts
type YearlyWorkspaceData = {
  schemaVersion: number;
  year: number;
  tasks: Task[];
  taskDailyMemos: TaskDailyMemo[];
  projectExclusions: ProjectExclusionPeriod[];
  updatedAt: string;
};
```

앱 시작 시 active year 데이터만 로드하고, 자동 저장도 현재 active year 데이터만 debounce 저장합니다.

## 주요 데이터 필드

- `Task.scheduleCertainty`: 일정 확정 여부입니다. `fixed` 또는 `tentative` 값을 가집니다.
- `TaskDailyMemo`: `taskId + date` 기준으로 저장되는 Task별 날짜 메모입니다.
- `ProjectExclusionPeriod`: 상위 프로젝트 Task에 귀속되는 제외기간입니다.

## Legacy migration

앱 최초 실행 시 기존 legacy storage가 있으면 연도별 구조로 마이그레이션합니다.

- legacy task key: `toodo.tasks.v1`
- legacy memo key: `gantt:taskDailyMemos`
- backup key: `toodo:legacyBackup:{timestamp}`

누락 필드는 다음 기본값으로 보정합니다.

- `Task.scheduleCertainty`: `fixed`
- `YearlyWorkspaceData.projectExclusions`: `[]`

## GitHub Release 업로드

수동 업로드:

```bash
npm run package:portable
gh release create v0.1.0-feedback release/Toodo-portable.zip \
  --title "Toodo v0.1.0 Feedback Preview" \
  --notes "Toodo 첫 피드백용 프리뷰 버전입니다."
```

이미 release가 있다면:

```bash
gh release upload v0.1.0-feedback release/Toodo-portable.zip --clobber
```

## GitHub Actions

`.github/workflows/release.yml`은 `v*` tag가 push되면 portable zip을 빌드하고 GitHub Release asset으로 업로드합니다.

예:

```bash
git tag v0.1.0-feedback
git push origin v0.1.0-feedback
```
