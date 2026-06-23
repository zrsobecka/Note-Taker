param(
  [string]$ExtensionId = "",
  [string]$DefaultSaveFolder = "",
  [switch]$OpenChromeExtensions
)

$ErrorActionPreference = "Stop"

$installer = Join-Path $PSScriptRoot "scripts\install_extension.ps1"
$arguments = @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $installer
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

$pwsh = Get-Command pwsh -ErrorAction SilentlyContinue
if ($pwsh) {
  & $pwsh.Source @arguments
  exit $LASTEXITCODE
}

& $installer @PSBoundParameters
