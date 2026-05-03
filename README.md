# Toodo

로컬에서 실행하는 Todo + Gantt 일정 관리 앱입니다.

Toodo는 두 가지 방식으로 사용할 수 있습니다.

- **Desktop 버전**: 설치형 앱입니다. 업무 데이터가 브라우저 캐시가 아니라 OS의 로컬 데이터 폴더에 JSON 파일로 저장됩니다.
- **Portable HTML 버전**: 설치 없이 `index.html`을 더블클릭해서 실행합니다. 데이터는 브라우저 저장소에 저장됩니다.

## 다운로드

현재 피드백용 배포 파일은 아래 Release에서 받을 수 있습니다.

https://github.com/Mark-093k/Toodo/releases/tag/v0.1.0-feedback

직접 다운로드:

- Portable HTML 버전: [Toodo-portable.zip](https://github.com/Mark-093k/Toodo/releases/download/v0.1.0-feedback/Toodo-portable.zip)
- Windows Desktop 버전: Release assets의 `Toodo-desktop-windows-...exe` 또는 `...msi` 파일

## Desktop 버전 사용 방법

1. Release에서 Windows Desktop 설치 파일을 다운로드합니다.
2. 설치 파일을 실행해서 Toodo를 설치합니다.
3. Toodo를 실행하면 바로 사용할 수 있습니다.

Desktop 버전은 데이터를 로컬 데이터 폴더에 저장합니다.

예상 저장 위치:

- Windows: 사용자 AppData 하위 Toodo 데이터 폴더
- macOS: Application Support 하위 Toodo 데이터 폴더
- Linux: XDG data directory 하위 Toodo 데이터 폴더

앱 상단의 `Data Folder` 버튼으로 실제 데이터 폴더를 열 수 있습니다.

## Portable HTML 버전 사용 방법

1. `Toodo-portable.zip`을 다운로드합니다.
2. 압축을 해제합니다.
3. 폴더 안의 `index.html`을 더블클릭합니다.
4. 브라우저에서 앱이 열리면 바로 사용합니다.

Node.js, npm, 개발환경 설치가 필요 없습니다.

권장 브라우저는 Chrome 또는 Edge입니다.

## 데이터 저장 안내

Desktop 버전:

- `meta.json`
- `years/{year}.json`
- `backups/*.json`

형태로 OS app data directory에 저장됩니다. 브라우저 캐시 삭제와 무관하게 유지됩니다.

Portable HTML 버전:

- 브라우저 IndexedDB 또는 localStorage에 저장됩니다.
- 브라우저 캐시나 사이트 저장소를 삭제하면 데이터가 사라질 수 있습니다.
- 중요한 데이터는 앱의 Export 기능으로 백업해주세요.

## Portable에서 Desktop으로 데이터 옮기기

1. 기존 Portable Toodo를 엽니다.
2. `Export All`을 실행해서 전체 데이터 JSON을 저장합니다.
3. Desktop Toodo를 설치하고 실행합니다.
4. Desktop Toodo에서 `Import All`로 백업 JSON을 가져옵니다.
5. 이후 데이터는 Desktop 앱의 로컬 데이터 폴더에 저장됩니다.

## 주요 기능

- Main Table 기반 Todo 관리
- Gantt View 일정 확인
- Task별 날짜 메모
- 연도별 데이터 분리
- 프로젝트 제외기간 설정
- 미정 일정 점선 표시
- 테마 변경
- 현재 연도 / 전체 연도 Export, Import 백업
- Desktop 버전 데이터 폴더 열기 및 현재 연도 백업

## 피드백

사용 중 불편한 점이나 개선 의견은 아래에 남겨주세요.

https://github.com/Mark-093k/Toodo/issues

## 개발자 문서

소스 실행, 빌드, release 생성 방법은 [DEVELOPER.md](./DEVELOPER.md)를 참고해주세요.

코드 서명과 notarization 준비는 [SIGNING.md](./SIGNING.md)를 참고해주세요.
