Toodo Desktop 사용자 안내

실행 방법
- GitHub Release에서 Windows Desktop 설치 파일을 다운로드합니다.
- 설치 파일을 실행한 뒤 Toodo를 실행하세요.
- Node.js, npm, Rust 설치가 필요하지 않습니다.

데이터 저장
- Desktop 버전은 데이터를 브라우저 캐시가 아니라 로컬 데이터 폴더의 JSON 파일에 저장합니다.
- 앱 상단의 Data Folder 버튼을 누르면 실제 데이터 폴더를 열 수 있습니다.
- 기본 구조는 meta.json, years/{year}.json, backups/ 입니다.

백업 / 복원
- Export Year 버튼으로 현재 연도 데이터를 JSON 파일로 백업할 수 있습니다.
- Export All 버튼으로 전체 연도 데이터를 JSON 파일로 백업할 수 있습니다.
- Backup Year 버튼은 현재 연도 JSON을 데이터 폴더의 backups/ 폴더에 복사합니다.
- Import Year / Import All 버튼으로 백업 JSON 파일을 다시 가져올 수 있습니다.

Portable에서 Desktop으로 데이터 옮기기
- 기존 portable Toodo에서 Export All을 실행합니다.
- Desktop Toodo를 실행합니다.
- Import All로 portable에서 만든 JSON 파일을 가져옵니다.
- 이후 데이터는 Desktop 앱의 로컬 데이터 폴더에 저장됩니다.

주의
- 데이터 폴더의 JSON 파일을 직접 편집하기 전에 반드시 백업하세요.
- 앱 실행 중 JSON 파일을 외부 프로그램으로 수정하면 저장 충돌이 날 수 있습니다.
