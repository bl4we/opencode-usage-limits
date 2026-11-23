$ErrorActionPreference = "Stop"

$homeDir = if ($HOME) { $HOME } else { $env:USERPROFILE }
$configRoot = if ($env:XDG_CONFIG_HOME) {
  Join-Path $env:XDG_CONFIG_HOME "opencode"
} else {
  Join-Path $homeDir ".config\opencode"
}
$dest = Join-Path $configRoot "plugins\usage-limits"

New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item (Join-Path $PSScriptRoot "package.json") $dest -Force
Copy-Item (Join-Path $PSScriptRoot "index.ts") $dest -Force
Copy-Item (Join-Path $PSScriptRoot "gui-experimental.cjs") $dest -Force
Copy-Item (Join-Path $PSScriptRoot "README.md") $dest -Force

Write-Host ""
Write-Host "OpenCode Usage Limits installed:" -ForegroundColor Green
Write-Host "  $dest"
Write-Host ""
Write-Host "Restart OpenCode or run: opencode reload"
Write-Host "Then open a session. The pill appears at the bottom of the left sidebar."
Write-Host ""
