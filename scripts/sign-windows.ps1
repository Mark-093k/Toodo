param(
  [string]$ReleaseDir = "release"
)

$ErrorActionPreference = "Stop"

if (-not $env:WINDOWS_CERTIFICATE_PATH -and -not $env:WINDOWS_CERTIFICATE_THUMBPRINT) {
  Write-Host "Windows signing skipped: no WINDOWS_CERTIFICATE_PATH or WINDOWS_CERTIFICATE_THUMBPRINT provided."
  exit 0
}

$signtool = Get-Command signtool.exe -ErrorAction SilentlyContinue
if (-not $signtool) {
  throw "signtool.exe was not found. Install Windows SDK or run on a GitHub Windows runner with signtool available."
}

$timestampUrl = if ($env:WINDOWS_TIMESTAMP_URL) { $env:WINDOWS_TIMESTAMP_URL } else { "http://timestamp.digicert.com" }
$files = Get-ChildItem -Path $ReleaseDir -File |
  Where-Object { $_.Name -like "Toodo-desktop-windows-*" -and ($_.Extension -eq ".exe" -or $_.Extension -eq ".msi") }

if (-not $files) {
  Write-Host "Windows signing skipped: no desktop installer files found in $ReleaseDir."
  exit 0
}

foreach ($file in $files) {
  Write-Host "Signing $($file.FullName)"

  if ($env:WINDOWS_CERTIFICATE_PATH) {
    $args = @(
      "sign",
      "/fd", "SHA256",
      "/tr", $timestampUrl,
      "/td", "SHA256",
      "/f", $env:WINDOWS_CERTIFICATE_PATH
    )

    if ($env:WINDOWS_CERTIFICATE_PASSWORD) {
      $args += @("/p", $env:WINDOWS_CERTIFICATE_PASSWORD)
    }

    $args += $file.FullName
    & $signtool.Source @args
  } else {
    & $signtool.Source sign /fd SHA256 /tr $timestampUrl /td SHA256 /sha1 $env:WINDOWS_CERTIFICATE_THUMBPRINT $file.FullName
  }
}
