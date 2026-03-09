# Clean install: remove node_modules and package-lock, then npm install.
# Run this with: PowerShell -ExecutionPolicy Bypass -File scripts/clean-install.ps1
# Or in PowerShell: .\scripts\clean-install.ps1

$projectRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$projectRoot\package.json")) {
    $projectRoot = "F:\BRIMS"
}
Set-Location $projectRoot

Write-Host "=== BRIMS Clean Install ===" -ForegroundColor Cyan
Write-Host "Project: $projectRoot"
Write-Host ""

# 1. Remove package-lock.json
if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
    Write-Host "Removed package-lock.json" -ForegroundColor Green
}

# 2. Remove node_modules using robocopy trick (works when files are locked)
if (Test-Path "node_modules") {
    Write-Host "Removing node_modules (this may take a minute)..." -ForegroundColor Yellow
    $emptyDir = Join-Path $projectRoot "._empty_tmp"
    New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
    & robocopy $emptyDir "node_modules" /MIR /R:1 /W:2 /NFL /NDL /NJH /NJS | Out-Null
    Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $emptyDir -Recurse -Force -ErrorAction SilentlyContinue
    if (Test-Path "node_modules") {
        Write-Host "WARNING: Some node_modules could not be removed. Close Cursor, ng serve, and any terminal in F:\BRIMS then run this script again." -ForegroundColor Red
        exit 1
    }
    Write-Host "Removed node_modules" -ForegroundColor Green
}

# 3. npm install
Write-Host ""
Write-Host "Running npm install..." -ForegroundColor Cyan
& npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install failed. Try running in a NEW terminal (outside Cursor) as Administrator." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done. You can run: ng serve" -ForegroundColor Green
