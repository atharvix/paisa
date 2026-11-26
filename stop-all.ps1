<#
.SYNOPSIS
    Gracefully terminates all background services for Anti-Scam Ticketing Platform.
#>

$WorkspaceRoot = $PSScriptRoot
Write-Host "Gracefully stopping all platform processes..." -ForegroundColor Yellow

# 1. Kill saved PIDs if available
$PidFile = Join-Path $WorkspaceRoot ".platform_pids.json"
if (Test-Path $PidFile) {
    try {
        $Pids = Get-Content $PidFile | ConvertFrom-Json
        foreach ($p in ($Pids.PythonPID, $Pids.JavaPID, $Pids.FrontendPID)) {
            if ($p -and $p -gt 0) {
                Write-Host "Stopping process PID: $p..." -ForegroundColor Cyan
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
            }
        }
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    } catch {}
}

# 2. Port sweep fallback (Ports 8080, 8000, 5173)
$Ports = @(8080, 8000, 5173)
foreach ($Port in $Ports) {
    try {
        $Connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($Connections) {
            foreach ($Conn in $Connections) {
                $PidToKill = $Conn.OwningProcess
                if ($PidToKill -gt 0) {
                    Write-Host "Releasing port $Port (PID: $PidToKill)..." -ForegroundColor Cyan
                    Stop-Process -Id $PidToKill -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {}
}

Write-Host "All Anti-Scam Platform services stopped cleanly." -ForegroundColor Green
