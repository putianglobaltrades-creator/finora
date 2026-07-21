param(
  [switch]$Dev,
  [switch]$Dist,
  [switch]$Install,
  [switch]$Portable
)

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot

Write-Host "=== Finora Build Script ===" -ForegroundColor Cyan
Write-Host ""

function Write-Step($msg) {
  Write-Host ">> $msg" -ForegroundColor Yellow
}

if ($Dev) {
  Write-Step "Starting development server..."
  npm run electron:dev
  exit
}

Write-Step "Building Vite frontend..."
Set-Location $ROOT
npm run build
if ($LASTEXITCODE -ne 0) { throw "Vite build failed" }
Write-Host "  ✓ Frontend built" -ForegroundColor Green

if ($Dist) {
  Write-Step "Building Electron distribution with electron-builder..."
  npx electron-builder --win --x64
  if ($LASTEXITCODE -ne 0) { throw "electron-builder failed" }
  Write-Host "  ✓ Distribution package created" -ForegroundColor Green
}

if ($Install) {
  Write-Step "Building NSIS installer..."
  if (Get-Command "makensis" -ErrorAction SilentlyContinue) {
    Set-Location "$ROOT\installer"
    makensis setup.nsi
    if ($LASTEXITCODE -ne 0) { throw "NSIS build failed" }
    Write-Host "  ✓ Installer created in release/" -ForegroundColor Green
  } else {
    Write-Host "  ✗ makensis not found. Install NSIS from https://nsis.sourceforge.io" -ForegroundColor Red
  }
}

if ($Portable) {
  Write-Step "Creating portable build..."
  npx electron-builder --win portable
  if ($LASTEXITCODE -ne 0) { throw "Portable build failed" }
  Write-Host "  ✓ Portable build created" -ForegroundColor Green
}

if (-not $Dev -and -not $Dist -and -not $Install -and -not $Portable) {
  Write-Host "Usage:" -ForegroundColor Cyan
  Write-Host "  .\build.ps1 -Dev        Start development server"
  Write-Host "  .\build.ps1 -Dist       Build production distribution"
  Write-Host "  .\build.ps1 -Install    Build NSIS installer"
  Write-Host "  .\build.ps1 -Portable   Build portable version"
  Write-Host "  .\build.ps1 -Dist -Install  Build both"
}

Set-Location $ROOT
Write-Host ""
Write-Host "=== Build complete ===" -ForegroundColor Cyan
