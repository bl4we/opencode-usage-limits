$ErrorActionPreference = "Stop"

$homeDir = if ($HOME) { $HOME } else { $env:USERPROFILE }
$configRoot = if ($env:XDG_CONFIG_HOME) {
  Join-Path $env:XDG_CONFIG_HOME "opencode"
} else {
  Join-Path $homeDir ".config\opencode"
}
$dest = Join-Path $configRoot "plugins\usage-limits"

if (Test-Path $dest) {
  Remove-Item $dest -Recurse -Force
  Write-Host "Removed: $dest" -ForegroundColor Green
} else {
  Write-Host "Not found: $dest"
}

Write-Host "Restart OpenCode or run: opencode reload"
