$ErrorActionPreference = "Stop"
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
$env:PGPASSWORD = "postgres"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " VERITIX ENTERPRISE TEST SUITE - FULL SYSTEM VERIFICATION" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$javaHealth = Invoke-RestMethod -Uri "http://localhost:8080/api/health"
$pyHealth   = Invoke-RestMethod -Uri "http://localhost:8000/api/geo/health"
if ($javaHealth.data.status -ne "UP" -or $pyHealth.status -ne "UP") {
    throw "Backend services are not UP. Run .\start-all.ps1 first."
}
Write-Host "[PRE-FLIGHT] Java (8080) and Python (8000) services are UP." -ForegroundColor Green

& "$PSScriptRoot\test_e2e_happy_path.ps1"
& "$PSScriptRoot\test_adversarial_fraud.ps1"
& "$PSScriptRoot\test_security_rbac.ps1"

Write-Host "`n[SQL AUDIT] Running Double-Entry Ledger and Capacity Invariants..." -ForegroundColor Cyan
psql -U postgres -d antiscam_ticketing -f "$PSScriptRoot\audit_ledger_invariants.sql"

Remove-Item Env:PGPASSWORD
Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " ALL AUTOMATED TEST SUITES COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
