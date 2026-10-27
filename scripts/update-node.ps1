# Update Node.js in place on the production server (Windows Server 2012 R2, PM2 + IIS)
#
# Usage (PowerShell "Run as Administrator", same user that owns PM2):
#   powershell -ExecutionPolicy Bypass -File C:\WebApps\DOHSaving-Web\scripts\update-node.ps1
#   powershell -ExecutionPolicy Bypass -File ...\update-node.ps1 -Version 22.23.4 -DryRun
#
# Steps: download zip + SHASUMS256 -> verify hash -> test new node.exe -> pm2 save/kill
#        -> backup old folder -> swap -> pm2 resurrect -> health check (auto rollback on failure)
#
# Written for PowerShell 4.0 (the 2012 R2 default) - no Expand-Archive, no PS5-only syntax.

param(
    [string]$Version = "22.23.4",
    [string]$NodeDir = "",
    [string]$AppName = "dohsaving-web",
    [string]$HealthUrl = "http://localhost:3000/api/health",
    [int]$HealthTimeoutSec = 90,
    # Download, verify and test the new binary only - do not stop PM2 or replace anything
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Write-Step([string]$msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg) { Write-Host "    $msg" -ForegroundColor Green }
function Write-Warn2([string]$msg) { Write-Host "    $msg" -ForegroundColor Yellow }

function Test-Health {
    $deadline = (Get-Date).AddSeconds($HealthTimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $res = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 10
            if ($res.StatusCode -eq 200) { return $true }
        } catch { }
        Start-Sleep -Seconds 3
    }
    return $false
}

# --- 0. Preconditions -------------------------------------------------------
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run this script from an elevated PowerShell (Run as Administrator)."
}

if (-not $NodeDir) {
    $nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
    if (-not $nodeCmd) { throw "node.exe not found on PATH. Pass -NodeDir explicitly." }
    $NodeDir = Split-Path -Parent $nodeCmd.Path
}
$NodeDir = $NodeDir.TrimEnd('\')

$pm2 = Get-Command pm2.cmd -ErrorAction SilentlyContinue
if (-not $pm2) { throw "pm2 not found on PATH for this user. Run as the user that runs PM2." }

$currentVersion = (& "$NodeDir\node.exe" -v).Trim()
Write-Step "Current Node: $currentVersion at $NodeDir"
Write-Step "Target Node:  v$Version"
if ($currentVersion -eq "v$Version") {
    Write-Ok "Already on v$Version - nothing to do."
    exit 0
}

# --- 1. Download zip + checksums -------------------------------------------
$baseName = "node-v$Version-win-x64"
$distUrl = "https://nodejs.org/dist/v$Version"
$workDir = Join-Path $env:TEMP "node-update-$Version"
$zipPath = Join-Path $workDir "$baseName.zip"
$sumsPath = Join-Path $workDir "SHASUMS256.txt"
$extractDir = Join-Path $workDir "extract"

if (Test-Path $workDir) { Remove-Item $workDir -Recurse -Force }
New-Item -ItemType Directory -Path $workDir | Out-Null

Write-Step "Downloading $distUrl/$baseName.zip"
Invoke-WebRequest -Uri "$distUrl/$baseName.zip" -OutFile $zipPath -UseBasicParsing
Invoke-WebRequest -Uri "$distUrl/SHASUMS256.txt" -OutFile $sumsPath -UseBasicParsing

# --- 2. Verify SHA-256 -----------------------------------------------------
Write-Step "Verifying SHA-256"
$expectedLine = Get-Content $sumsPath | Where-Object { $_ -match "\s$([regex]::Escape("$baseName.zip"))$" }
if (-not $expectedLine) { throw "$baseName.zip not listed in SHASUMS256.txt" }
$expected = ($expectedLine -split '\s+')[0].ToLower()
$actual = (Get-FileHash -Path $zipPath -Algorithm SHA256).Hash.ToLower()
if ($expected -ne $actual) {
    throw "Hash mismatch! expected=$expected actual=$actual - do NOT install this file."
}
Write-Ok "Hash OK ($actual)"

# --- 3. Extract and smoke-test the new binary before touching anything ------
Write-Step "Extracting"
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $extractDir)
$newDir = Join-Path $extractDir $baseName

Write-Step "Testing new node.exe on this OS"
$testOut = ""
$testExit = 1
try {
    $ErrorActionPreference = "Continue"
    $testOut = & "$newDir\node.exe" -e "console.log(process.version + ' ' + typeof require('zlib').brotliDecompressSync)" 2>&1
    $testExit = $LASTEXITCODE
} catch {
    $testOut = $_.Exception.Message
} finally {
    $ErrorActionPreference = "Stop"
}
if ($testExit -ne 0 -or "$testOut" -notmatch "^v$([regex]::Escape($Version)) function") {
    Write-Warn2 "$testOut"
    Write-Warn2 "If the message mentions an unsupported Windows version, check that the"
    Write-Warn2 "NODE_SKIP_PLATFORM_CHECK=1 machine environment variable is set (the current Node needs it too)."
    throw "New node.exe failed to run - aborting, nothing was changed."
}
Write-Ok "$testOut"

if ($DryRun) {
    Write-Ok "DryRun: download, hash and binary test passed. Nothing was changed."
    exit 0
}

# --- 4. Stop PM2 (node.exe is locked while running) -------------------------
Write-Step "Saving and stopping PM2 (site goes down until step 6)"
& pm2.cmd save | Out-Host
& pm2.cmd kill | Out-Host
Start-Sleep -Seconds 2
$stillRunning = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$NodeDir\*" }
if ($stillRunning) {
    Write-Warn2 "Stopping leftover node.exe processes: $($stillRunning.Id -join ', ')"
    $stillRunning | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# --- 5. Backup old folder and swap in the new one ---------------------------
$backupDir = "$NodeDir.bak-$($currentVersion.TrimStart('v'))-$(Get-Date -Format yyyyMMddHHmmss)"
Write-Step "Backing up $NodeDir -> $backupDir"
try {
    Rename-Item -Path $NodeDir -NewName (Split-Path -Leaf $backupDir)
} catch {
    Write-Warn2 "Cannot rename $NodeDir (a file is still in use - close other terminals/editors using node). Restarting PM2."
    & pm2.cmd resurrect | Out-Host
    throw
}
try {
    Move-Item -Path $newDir -Destination $NodeDir
} catch {
    Write-Warn2 "Swap failed, restoring backup"
    Rename-Item -Path $backupDir -NewName (Split-Path -Leaf $NodeDir)
    & pm2.cmd resurrect | Out-Host
    throw
}
Write-Ok "Installed: $((& "$NodeDir\node.exe" -v).Trim())"

# --- 6. Bring the app back and health-check ---------------------------------
Write-Step "Starting PM2 (pm2 resurrect)"
& pm2.cmd resurrect | Out-Host

Write-Step "Health check $HealthUrl (up to $HealthTimeoutSec s)"
if (Test-Health) {
    Write-Ok "Healthy on Node v$Version"
    & pm2.cmd save | Out-Host
    Write-Host ""
    Write-Host "Done. Backup kept at: $backupDir" -ForegroundColor Green
    Write-Host "Delete it after a few days once everything looks fine."
    Remove-Item $workDir -Recurse -Force -ErrorAction SilentlyContinue
    exit 0
}

# --- 7. Rollback --------------------------------------------------------------
Write-Warn2 "Health check FAILED - rolling back to $currentVersion"
& pm2.cmd logs $AppName --lines 40 --nostream | Out-Host
& pm2.cmd kill | Out-Host
Start-Sleep -Seconds 2
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "$NodeDir\*" } | Stop-Process -Force
Rename-Item -Path $NodeDir -NewName "$(Split-Path -Leaf $NodeDir).failed-$Version-$(Get-Date -Format yyyyMMddHHmmss)"
Rename-Item -Path $backupDir -NewName (Split-Path -Leaf $NodeDir)
& pm2.cmd resurrect | Out-Host
if (Test-Health) {
    Write-Warn2 "Rolled back to $currentVersion and the site is healthy again."
} else {
    Write-Warn2 "Rolled back to $currentVersion but health check still fails - check 'pm2 logs $AppName'."
}
exit 1
