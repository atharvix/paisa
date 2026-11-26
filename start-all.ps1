<#
.SYNOPSIS
    Starts all native local processes for the Anti-Scam Ticketing Platform on Windows.
    NO DOCKER, NO CONTAINERIZATION.
#>

$ErrorActionPreference = "Continue"
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Starting Anti-Scam Event Ticketing & Escrow Settlement Platform " -ForegroundColor Yellow
Write-Host " Running directly on Bare-Metal Local OS Processes (No Docker)   " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$WorkspaceRoot = $PSScriptRoot

# Clean up stale SSL cert variables if pointing to invalid paths
$env:CURL_CA_BUNDLE = $null
$env:SSL_CERT_FILE = $null

# 1. Check prerequisites
Write-Host "`n[1/5] Checking Toolchains..." -ForegroundColor Green
$JavaVer = & java -version 2>&1 | Select-Object -First 1
$MavenVer = & mvn -version 2>&1 | Select-Object -First 1
$PythonVer = & python --version 2>&1 | Select-Object -First 1
$NodeVer = & node -v 2>&1 | Select-Object -First 1

Write-Host " - Java: $JavaVer"
Write-Host " - Maven: $MavenVer"
Write-Host " - Python: $PythonVer"
Write-Host " - Node.js: $NodeVer"

# 2. Check Database Connectivity
Write-Host "`n[2/5] Checking PostgreSQL Database Service (Port 5432)..." -ForegroundColor Green
$DbPort = 5432
$DbTest = Test-NetConnection -ComputerName "localhost" -Port $DbPort -InformationLevel Quiet
if ($DbTest) {
    Write-Host "PostgreSQL is reachable on port 5432." -ForegroundColor Green
} else {
    Write-Host "Notice: PostgreSQL not listening on port 5432. Ensure local Postgres service is started." -ForegroundColor Yellow
}

# 3. Start Python FastAPI & APScheduler Fraud Service (Port 8000)
Write-Host "`n[3/5] Starting Python Geo-Verification & Escrow Scheduler Service (Port 8000)..." -ForegroundColor Green
$PythonDir = Join-Path $WorkspaceRoot "service-python"
$PythonProcess = Start-Process -FilePath "python" -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8000 --reload" -WorkingDirectory $PythonDir -PassThru
Write-Host "Python Fraud/Geo Service started with PID: $($PythonProcess.Id)" -ForegroundColor Cyan

# 4. Start Java Spring Boot Financial Core Service (Port 8080)
Write-Host "`n[4/5] Starting Java Spring Boot Financial & RBAC Service (Port 8080)..." -ForegroundColor Green
$JavaDir = Join-Path $WorkspaceRoot "backend-java"
$MvnProcess = Start-Process -FilePath "mvn.cmd" -ArgumentList "spring-boot:run" -WorkingDirectory $JavaDir -PassThru
Write-Host "Spring Boot Core Service starting with PID: $($MvnProcess.Id)" -ForegroundColor Cyan

# 5. Start React Frontend (Port 5173)
Write-Host "`n[5/5] Starting React + Tailwind + Vite Frontend (Port 5173)..." -ForegroundColor Green
$FrontendDir = Join-Path $WorkspaceRoot "frontend-react"
$NpmProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $FrontendDir -PassThru
Write-Host "React Frontend started with PID: $($NpmProcess.Id)" -ForegroundColor Cyan

# Save PIDs for graceful teardown
@{
    PythonPID = $PythonProcess.Id
    JavaPID = $MvnProcess.Id
    FrontendPID = $NpmProcess.Id
} | ConvertTo-Json | Set-Content (Join-Path $WorkspaceRoot ".platform_pids.json")

Write-Host "`n=================================================================" -ForegroundColor Yellow
Write-Host " All services launched! Access endpoints:                        " -ForegroundColor Yellow
Write-Host " - Frontend UI:        http://localhost:5173" -ForegroundColor White
Write-Host " - Core Java API:      http://localhost:8080/api/health" -ForegroundColor White
Write-Host " - Python Fraud/Geo:   http://localhost:8000/api/geo/health" -ForegroundColor White
Write-Host " - Escrow Scheduler:   Active (APScheduler background loop 60s)" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Yellow
Write-Host "To gracefully stop all services, run: .\stop-all.ps1" -ForegroundColor Magenta
