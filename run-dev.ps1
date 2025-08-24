<#
Simple one-click runner for Windows PowerShell.
It installs dependencies (if missing), runs the fast seed, and starts the Next dev server.
Usage: Right-click -> Run with PowerShell, or from terminal:
    .\run-dev.ps1
#>
Set-StrictMode -Version Latest

Write-Host "Checking dependencies..."
if (-not (Test-Path node_modules)) {
  Write-Host "Installing npm dependencies..."
  npm install
}

Write-Host "Running fast seed..."
npm run prisma:seed

Write-Host "Starting dev server..."
npm run dev
