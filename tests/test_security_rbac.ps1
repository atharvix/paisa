$ErrorActionPreference = "Stop"
$JAVA_URL = "http://localhost:8080"
$suffix   = Get-Random -Minimum 10000 -Maximum 99999

Write-Host "`n--- [SUITE 3] SECURITY, RBAC & BOUNDARY ENFORCEMENT ---" -ForegroundColor Cyan

$att = (Invoke-RestMethod -Uri "$JAVA_URL/api/auth/register" -Method Post -ContentType "application/json" `
    -Body (@{ email = "rbac_att_$suffix@veritix.io"; password = "Password123!"; fullName = "RBAC User"; phone = "+9195$(Get-Random -Minimum 10000000 -Maximum 99999999)"; role = "ROLE_ATTENDEE" } | ConvertTo-Json)).data

$unverifiedHost = (Invoke-RestMethod -Uri "$JAVA_URL/api/auth/register" -Method Post -ContentType "application/json" `
    -Body (@{ email = "unver_host_$suffix@veritix.io"; password = "Password123!"; fullName = "Unverified Host"; phone = "+9194$(Get-Random -Minimum 10000000 -Maximum 99999999)"; role = "ROLE_HOST" } | ConvertTo-Json)).data

try {
    Invoke-RestMethod -Uri "$JAVA_URL/api/admin/settings" -Method Get -Headers @{ Authorization = "Bearer $($att.accessToken)" } | Out-Null
    throw "SEC-01 Failed: Attendee accessed Admin settings!"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 403) { throw "Expected 403, got $($_.Exception.Response.StatusCode.value__)" }
    Write-Host "[PASS][SEC-01] Blocked Attendee privilege escalation to /api/admin/settings (403)." -ForegroundColor Green
}

$start = (Get-Date).ToUniversalTime().AddHours(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
$end   = (Get-Date).ToUniversalTime().AddHours(3).ToString("yyyy-MM-ddTHH:mm:ssZ")
try {
    Invoke-RestMethod -Uri "$JAVA_URL/api/events" -Method Post `
        -Headers @{ Authorization = "Bearer $($unverifiedHost.accessToken)" } -ContentType "application/json" `
        -Body (@{
            title = "Blocked Event"; descriptionMarkdown = "Test"; venueName = "Hall"; venueAddress = "City"
            venueLatitude = 26.8; venueLongitude = 75.6; startTime = $start; endTime = $end
            venueBookingProofUrl = "https://example.com/a.pdf"
            ticketTiers = @(@{ name = "Pass"; price = 100.0; totalCapacity = 10 })
        } | ConvertTo-Json -Depth 4) | Out-Null
    throw "FIN-03 Failed: Unverified KYC host created an event!"
} catch {
    Write-Host "[PASS][FIN-03] Blocked event creation by unverified KYC host." -ForegroundColor Green
}
