<#
.SYNOPSIS
  Sets up (if needed) and runs the whole of CarbonShift: backend + frontend.

.DESCRIPTION
  Run from anywhere:  .\run.ps1   (or double-click / type `run` for run.cmd)
  - Creates the Python venv and installs backend packages when missing or changed
  - Runs npm install when frontend packages are missing or changed
  - Creates backend\.env and frontend\.env.local if they don't exist
  - Stops an old copy of this project still holding port 8000 or 3000
  - Runs both servers in this window; Ctrl+C stops both

.PARAMETER Reload
  Restart the backend automatically when Python files change.

.PARAMETER NoBrowser
  Don't open the browser once the app is ready.
#>
param(
  [switch]$Reload,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$venvPython = Join-Path $backend "venv\Scripts\python.exe"
$BackendPort = 8000
$FrontendPort = 3000

function Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Warn($msg) { Write-Host "    $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

function Get-FileHashText($path) { (Get-FileHash $path -Algorithm SHA256).Hash }

# Kills a process and its children; fine if it has already exited
function Stop-Tree($id) {
  cmd /c "taskkill /PID $id /T /F >nul 2>&1"
}

function Test-ProjectProcess($proc) {
  $proc -and ("$($proc.ExecutablePath) $($proc.CommandLine)" -like "*$root*")
}

# Stops whatever listens on $port if it belongs to this project; refuses otherwise.
# The venv's python.exe is a launcher that starts the system Python, and uvicorn's
# reloader adds another layer, so the project path may only show on an ancestor.
function Clear-Port($port) {
  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $conn) { return }
  $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($conn.OwningProcess)"
  $chain = @($proc)
  $current = $proc
  for ($i = 0; $i -lt 3 -and $current; $i++) {
    $current = Get-CimInstance Win32_Process -Filter "ProcessId=$($current.ParentProcessId)" -ErrorAction SilentlyContinue
    if ($current) { $chain += $current }
  }
  $ours = @($chain | Where-Object { Test-ProjectProcess $_ })
  if ($ours.Count -eq 0) {
    Fail "Port $port is used by another program ($($proc.Name), PID $($proc.ProcessId)). Close it and run again."
  }
  Warn "Stopping an old copy of this project on port $port (PID $($proc.ProcessId))"
  # Kill server processes from the outermost down so nothing restarts the server;
  # never touch the shells (cmd/powershell) that launched them
  $servers = @($chain | Where-Object { $_.Name -in @("python.exe", "node.exe") })
  [array]::Reverse($servers)
  foreach ($p in $servers) { Stop-Tree $p.ProcessId }
  Stop-Tree $proc.ProcessId
  Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "CarbonShift" -ForegroundColor Green
Write-Host ""

# --- Prerequisites ---
if (-not (Get-Command python -ErrorAction SilentlyContinue)) { Fail "Python is not installed or not on PATH (python.org, 3.11+)." }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Fail "Node.js is not installed or not on PATH (nodejs.org, 20+)." }

# --- Backend setup ---
if (-not (Test-Path $venvPython)) {
  Step "Creating Python virtual environment"
  python -m venv (Join-Path $backend "venv")
  if ($LASTEXITCODE -ne 0) { Fail "Could not create the virtual environment." }
}

$requirements = Join-Path $backend "requirements.txt"
$reqStamp = Join-Path $backend "venv\.requirements.sha256"
$reqHash = Get-FileHashText $requirements
if (-not (Test-Path $reqStamp) -or (Get-Content $reqStamp -Raw).Trim() -ne $reqHash) {
  Step "Installing backend packages"
  & $venvPython -m pip install --disable-pip-version-check -q -r $requirements
  if ($LASTEXITCODE -ne 0) { Fail "pip install failed." }
  Set-Content -Path $reqStamp -Value $reqHash -Encoding ascii
}

$envFile = Join-Path $backend ".env"
if (-not (Test-Path $envFile)) {
  Copy-Item (Join-Path $backend ".env.example") $envFile
  Warn "Created backend\.env - put your Groq API key in it to enable AI predictions."
}
if ((Get-Content $envFile -Raw) -notmatch "GROQ_API_KEY=gsk_") {
  Warn "No Groq API key in backend\.env: AI predictions will not work until you add one."
}

# --- Frontend setup ---
$lockFile = Join-Path $frontend "package-lock.json"
$npmStamp = Join-Path $frontend "node_modules\.package-lock.sha256"
$lockHash = Get-FileHashText $lockFile
if (-not (Test-Path $npmStamp) -or (Get-Content $npmStamp -Raw).Trim() -ne $lockHash) {
  Step "Installing frontend packages (first run takes a minute)"
  Push-Location $frontend
  npm install --no-audit --no-fund
  $npmExit = $LASTEXITCODE
  Pop-Location
  if ($npmExit -ne 0) { Fail "npm install failed." }
  # npm install may rewrite the lock file, so stamp what it left behind
  Set-Content -Path $npmStamp -Value (Get-FileHashText $lockFile) -Encoding ascii
}

$frontendEnv = Join-Path $frontend ".env.local"
if (-not (Test-Path $frontendEnv)) {
  Set-Content -Path $frontendEnv -Encoding ascii -Value @(
    "NEXT_PUBLIC_USE_MOCK=false",
    "NEXT_PUBLIC_API_URL=http://localhost:$BackendPort"
  )
}

# --- Ports ---
Clear-Port $BackendPort
Clear-Port $FrontendPort

# --- Run ---
$uvicornArgs = @("-m", "uvicorn", "main:app", "--port", "$BackendPort")
if ($Reload) { $uvicornArgs += "--reload" }

Step "Starting backend  -> http://localhost:$BackendPort"
$backendProc = Start-Process -FilePath $venvPython -ArgumentList $uvicornArgs -WorkingDirectory $backend -NoNewWindow -PassThru

$browserJob = $null
if (-not $NoBrowser) {
  # Open the app once the frontend answers
  $browserJob = Start-Job -ArgumentList $FrontendPort -ScriptBlock {
    param($port)
    for ($i = 0; $i -lt 120; $i++) {
      try {
        Invoke-WebRequest "http://localhost:$port" -UseBasicParsing -TimeoutSec 5 | Out-Null
        Start-Process "http://localhost:$port"
        return
      } catch { Start-Sleep -Seconds 1 }
    }
  }
}

Step "Starting frontend -> http://localhost:$FrontendPort"
Write-Host "    Press Ctrl+C to stop both." -ForegroundColor DarkGray
Write-Host ""
try {
  Push-Location $frontend
  npm run dev
} finally {
  Pop-Location
  Write-Host ""
  Step "Stopping servers"
  if ($browserJob) { Remove-Job $browserJob -Force -ErrorAction SilentlyContinue }
  if ($backendProc -and -not $backendProc.HasExited) { Stop-Tree $backendProc.Id }
}
