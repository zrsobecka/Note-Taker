param(
  [string]$ExtensionId = "",
  [string]$DefaultSaveFolder = "",
  [switch]$OpenChromeExtensions
)

$ErrorActionPreference = "Stop"

if ($PSVersionTable.PSEdition -ne "Core" -or $PSVersionTable.PSVersion.Major -lt 7) {
  $pwsh = Get-Command pwsh -ErrorAction SilentlyContinue
  if (-not $pwsh) {
    throw "PowerShell 7 was not found. Install it or run this script from a PowerShell 7 terminal."
  }

  $arguments = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $PSCommandPath
  )

  if ($ExtensionId) {
    $arguments += @("-ExtensionId", $ExtensionId)
  }

  if ($DefaultSaveFolder) {
    $arguments += @("-DefaultSaveFolder", $DefaultSaveFolder)
  }

  if ($OpenChromeExtensions) {
    $arguments += "-OpenChromeExtensions"
  }

  & $pwsh.Source @arguments
  exit $LASTEXITCODE
}

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ExtensionDir = Join-Path $RepoRoot "extension"
$NativeHostDir = Join-Path $RepoRoot "native-host"
$ConfigPath = Join-Path $NativeHostDir "config.json"
$ConfigExamplePath = Join-Path $NativeHostDir "config.example.json"
$PythonInstallerPath = Join-Path $NativeHostDir "install_native_host.py"

if (-not (Test-Path -LiteralPath $ExtensionDir)) {
  throw "Extension folder not found: $ExtensionDir"
}

if (-not (Test-Path -LiteralPath $PythonInstallerPath)) {
  throw "Native host installer not found: $PythonInstallerPath"
}

if (-not (Test-Path -LiteralPath $ConfigPath)) {
  Copy-Item -LiteralPath $ConfigExamplePath -Destination $ConfigPath
  Write-Host "Created native-host config: $ConfigPath"
}

if ($DefaultSaveFolder) {
  $resolvedSaveFolder = [System.IO.Path]::GetFullPath($DefaultSaveFolder)
  New-Item -ItemType Directory -Path $resolvedSaveFolder -Force | Out-Null

  $config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
  if ($config.PSObject.Properties.Name -contains "default_save_folder") {
    $config.default_save_folder = $resolvedSaveFolder
  } else {
    $config | Add-Member -NotePropertyName "default_save_folder" -NotePropertyValue $resolvedSaveFolder
  }

  $config | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $ConfigPath -Encoding UTF8
  Write-Host "Configured default save folder: $resolvedSaveFolder"
}

$python = Get-Command python -ErrorAction Stop
$installerArgs = @($PythonInstallerPath)
if ($ExtensionId) {
  $installerArgs += @("--extension-id", $ExtensionId)
}

& $python.Source @installerArgs
if ($LASTEXITCODE -ne 0) {
  throw "Native host installer failed with exit code $LASTEXITCODE"
}

Write-Host ""
Write-Host "Extension folder to load in Chrome:"
Write-Host $ExtensionDir

if (-not $ExtensionId) {
  Write-Host ""
  Write-Host "Next step:"
  Write-Host "1. Open chrome://extensions"
  Write-Host "2. Enable Developer mode"
  Write-Host "3. Click Load unpacked and choose the extension folder above"
  Write-Host "4. Copy the extension ID"
  Write-Host "5. Run this script again with -ExtensionId YOUR_EXTENSION_ID"
}

if ($OpenChromeExtensions) {
  Start-Process "chrome.exe" "chrome://extensions"
}
