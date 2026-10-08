<#
.SYNOPSIS
  Stops CarbonShift development servers.

.DESCRIPTION
  Run from anywhere:  .\stop.ps1   (or double-click / type `stop` for stop.cmd)
  Stops this project's backend and frontend if they are listening on ports 8000
  or 3000. It refuses to kill unrelated programs using those ports.
#>

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$Ports = @(8000, 3000)

function Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Warn($msg) { Write-Host "    $msg" -ForegroundColor Yellow }

function Stop-Tree($id) {
  cmd /c "taskkill /PID $id /T /F >nul 2>&1"
}

function Test-ProjectProcess($proc) {
  $proc -and ("$($proc.ExecutablePath) $($proc.CommandLine)" -like "*$root*")
}

function Stop-ProjectPort($port) {
  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $conn) {
    Warn "Nothing is listening on port $port."
    return
  }

  $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$($conn.OwningProcess)"
  $chain = @($proc)
  $current = $proc
  for ($i = 0; $i -lt 3 -and $current; $i++) {
    $current = Get-CimInstance Win32_Process -Filter "ProcessId=$($current.ParentProcessId)" -ErrorAction SilentlyContinue
    if ($current) { $chain += $current }
  }

  $ours = @($chain | Where-Object { Test-ProjectProcess $_ })
  if ($ours.Count -eq 0) {
    Warn "Port $port is used by another program ($($proc.Name), PID $($proc.ProcessId)); leaving it alone."
    return
  }

  Warn "Stopping CarbonShift on port $port (PID $($proc.ProcessId))."
  $servers = @($chain | Where-Object { $_.Name -in @("python.exe", "node.exe") })
  [array]::Reverse($servers)
  foreach ($p in $servers) { Stop-Tree $p.ProcessId }
  Stop-Tree $proc.ProcessId
}

Write-Host ""
Write-Host "CarbonShift stop" -ForegroundColor Green
Write-Host ""

foreach ($port in $Ports) {
  Stop-ProjectPort $port
}

Start-Sleep -Milliseconds 500
Write-Host ""
Step "Done"
