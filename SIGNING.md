# Toodo Signing Guide

This document describes how to prepare code signing for Toodo Desktop.

No certificate, password, private key, or signing secret should ever be committed to this repository.

## Current State

Unsigned preview builds are supported.

The repository includes:

- `scripts/sign-windows.ps1`
- GitHub Actions secret placeholders
- documentation for future Windows and macOS signing

If no signing environment variables are provided, the signing script exits successfully and skips signing.

## Windows Code Signing

For public Windows distribution, use a trusted code signing certificate.

Recommended inputs:

- Windows code signing certificate
- `.pfx` certificate file or certificate store thumbprint
- certificate password
- Windows SDK `signtool.exe`
- timestamp server URL

Environment variables:

```powershell
$env:WINDOWS_CERTIFICATE_PATH="C:\secure\toodo-signing.pfx"
$env:WINDOWS_CERTIFICATE_PASSWORD="..."
$env:WINDOWS_CERTIFICATE_THUMBPRINT="..."
$env:WINDOWS_TIMESTAMP_URL="http://timestamp.digicert.com"
```

Local signing flow:

```powershell
npm run package:desktop
.\scripts\sign-windows.ps1
```

`WINDOWS_CERTIFICATE_PATH` is used for `.pfx` file signing.

`WINDOWS_CERTIFICATE_THUMBPRINT` is used for certificate store signing.

If both are set, the script prefers the `.pfx` path.

## GitHub Actions Secrets

Use repository secrets for signing values:

- `WINDOWS_CERTIFICATE_PATH`
- `WINDOWS_CERTIFICATE_PASSWORD`
- `WINDOWS_CERTIFICATE_THUMBPRINT`
- `WINDOWS_TIMESTAMP_URL`

Do not print certificate values or passwords in logs.

For a real CI signing setup, prefer storing the certificate securely outside the repo and injecting it into the runner through secrets.

## SmartScreen Note

Code signing improves trust, but Windows SmartScreen reputation can still take time to build.

A self-signed certificate is acceptable for internal testing, but it is not appropriate for public user distribution.

## macOS Signing and Notarization

The current implementation is Windows-first, but the project structure can be extended for macOS.

Required items:

- Apple Developer account
- Developer ID Application certificate
- hardened runtime
- entitlements file if needed
- notarization credentials
- stapling after notarization

Suggested future environment variables:

```bash
APPLE_ID
APPLE_PASSWORD
APPLE_TEAM_ID
APPLE_CERTIFICATE
APPLE_CERTIFICATE_PASSWORD
```

macOS signing and notarization should be added to a macOS GitHub Actions job when distribution is ready.
