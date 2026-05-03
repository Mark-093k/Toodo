# Toodo Signing Guide

이 문서는 Toodo Desktop 앱의 코드 서명 준비 절차를 정리합니다.

## 원칙

- 인증서 파일, private key, 비밀번호는 절대 Git repository에 커밋하지 않습니다.
- 로컬 환경변수 또는 GitHub Actions Secrets로만 주입합니다.
- 인증서가 없어도 unsigned preview build는 가능해야 합니다.
- 서명을 적용해도 Windows SmartScreen 평판은 시간이 필요할 수 있습니다.

## Windows code signing

일반 사용자 배포용으로는 신뢰 가능한 Code Signing Certificate가 필요합니다.

준비물:

- Windows code signing certificate
- `.pfx` 인증서 파일 또는 Windows certificate store thumbprint
- 인증서 비밀번호
- Windows SDK의 `signtool.exe`
- timestamp server URL

환경변수:

```powershell
$env:WINDOWS_CERTIFICATE_PATH="C:\secure\toodo-signing.pfx"
$env:WINDOWS_CERTIFICATE_PASSWORD="..."
$env:WINDOWS_CERTIFICATE_THUMBPRINT="..."
$env:WINDOWS_TIMESTAMP_URL="http://timestamp.digicert.com"
```

로컬 signing:

```powershell
npm run package:desktop
.\scripts\sign-windows.ps1
```

`WINDOWS_CERTIFICATE_PATH`가 있으면 `.pfx` 파일로 서명합니다.

`WINDOWS_CERTIFICATE_PATH`가 없고 `WINDOWS_CERTIFICATE_THUMBPRINT`가 있으면 certificate store의 thumbprint로 서명합니다.

인증서 관련 값이 없으면 script는 실패하지 않고 signing을 건너뜁니다.

## GitHub Actions Secrets

권장 secret:

- `WINDOWS_CERTIFICATE_PATH`
- `WINDOWS_CERTIFICATE_PASSWORD`
- `WINDOWS_CERTIFICATE_THUMBPRINT`
- `WINDOWS_TIMESTAMP_URL`

실제 운영에서는 인증서 파일을 repository에 두지 말고, GitHub Actions에서 base64 secret으로 복원하거나, self-hosted runner의 secure certificate store를 사용하세요.

예:

- `WINDOWS_CERTIFICATE_BASE64`
- `WINDOWS_CERTIFICATE_PASSWORD`

workflow에서 base64를 임시 `.pfx`로 복원하고 `WINDOWS_CERTIFICATE_PATH`를 해당 경로로 지정할 수 있습니다.

임시 인증서 파일은 signing 후 삭제해야 합니다.

## macOS signing and notarization

macOS 배포를 추가하려면 다음이 필요합니다.

- Apple Developer Program 계정
- Developer ID Application certificate
- Hardened Runtime
- entitlements 설정
- Apple notarization
- stapling

GitHub Actions 또는 로컬 빌드 환경에서는 다음 값을 secret/environment로 관리합니다.

- `APPLE_ID`
- `APPLE_PASSWORD` 또는 app-specific password
- `APPLE_TEAM_ID`
- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_SIGNING_IDENTITY`

macOS 빌드 산출물은 `.app` 또는 `.dmg` 형태로 확장할 수 있습니다.

## 주의

- self-signed certificate는 내부 테스트에는 가능하지만 일반 사용자 배포용 신뢰 확보에는 적합하지 않습니다.
- 서명 인증서와 비밀번호를 로그에 출력하지 마세요.
- release artifact에 인증서 파일이 포함되지 않도록 반드시 확인하세요.
