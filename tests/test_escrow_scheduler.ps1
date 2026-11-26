# Save Suite 4 into tests/test_escrow_scheduler.ps1
@'
$ErrorActionPreference = "Stop"
$JAVA_URL = "http://localhost:8080"
$suffix   = Get-Random -Minimum 10000 -Maximum 99999

Write-Host "`n--- [SUITE 4] APSCHEDULER ESCROW AUTO-RELEASE VERIFICATION ---" -ForegroundColor Cyan

psql -U postgres -d antiscam_ticketing -c "UPDATE system_settings SET setting_value = '30' WHERE setting_key = 'ESCROW_HOLD_DURATION_SECONDS';" | Out-Null

$hostRes = (Invoke-RestMethod -Uri "$JAVA_URL/api/auth/register" -Method Post -ContentType "application/json" `
    -Body (@{ email = "schedhost_$suffix@veritix.io"; password = "Password123!"; fullName = "Scheduler Host"; phone = "+9193$(Get-Random -Minimum 10000000 -Maximum 99999999)"; role = "ROLE_HOST" } | ConvertTo-Json)).data
psql -U postgres -d antiscam_ticketing -c "UPDATE host_profiles SET kyc_status = 'VERIFIED', razorpay_account_id = 'acc_sched_$suffix' WHERE user_id = $($hostRes.user.id);" | Out-Null

$attRes = (Invoke-RestMethod -Uri "$JAVA_URL/api/auth/register" -Method Post -ContentType "application/json" `
    -Body (@{ email = "schedatt_$suffix@veritix.io"; password = "Password123!"; fullName = "Scheduler Buyer"; phone = "+9192$(Get-Random -Minimum 10000000 -Maximum 99999999)"; role = "ROLE_ATTENDEE" } | ConvertTo-Json)).data

$start = (Get-Date).ToUniversalTime().AddMinutes(-5).ToString("yyyy-MM-ddTHH:mm:ssZ")
$end   = (Get-Date).ToUniversalTime().AddSeconds(10).ToString("yyyy-MM-ddTHH:mm:ssZ")

$ev = (Invoke-RestMethod -Uri "$JAVA_URL/api/events" -Method Post `
    -Headers @{ Authorization = "Bearer $($hostRes.accessToken)" } -ContentType "application/json" `
    -Body (@{
        title = "Scheduler Auto-Payout Test #$suffix"; descriptionMarkdown = "Testing 30s escrow release"
        venueName = "Settlement Hall"; venueAddress = "Jaipur"; venueLatitude = 26.8500; venueLongitude = 75.8000
        startTime = $start; endTime = $end; venueBookingProofUrl = "https://example.com/sched_$suffix.pdf"
        ticketTiers = @(@{ name = "Standard"; price = 1000.00; totalCapacity = 5 })
    } | ConvertTo-Json -Depth 4)).data

$evId = $ev.id; $trId = $ev.ticketTiers[0].id
psql -U postgres -d antiscam_ticketing -c "UPDATE events SET status = 'VERIFIED_LIVE' WHERE id = $evId;" | Out-Null

$k = [guid]::NewGuid().ToString()
$init = (Invoke-RestMethod -Uri "$JAVA_URL/api/bookings/initiate" -Method Post `
    -Headers @{ Authorization = "Bearer $($attRes.accessToken)" } -ContentType "application/json" `
    -Body (@{ eventId = $evId; ticketTierId = $trId; idempotencyKey = $k } | ConvertTo-Json)).data
$ver = (Invoke-RestMethod -Uri "$JAVA_URL/api/bookings/verify" -Method Post `
    -Headers @{ Authorization = "Bearer $($attRes.accessToken)" } -ContentType "application/json" `
    -Body (@{ razorpayOrderId = $init.razorpayOrderId; razorpayPaymentId = "pay_sched_$suffix"; razorpaySignature = "sig_$suffix"; idempotencyKey = $k } | ConvertTo-Json)).data

$targetEvId = $ver.eventId
psql -U postgres -d antiscam_ticketing -c "UPDATE escrow_transfers SET on_hold_until = NOW() + INTERVAL '15 seconds', status = 'ON_HOLD' WHERE event_id = $targetEvId;" | Out-Null

$released = $false
for ($sec = 5; $sec -le 90; $sec += 5) {
    Start-Sleep -Seconds 5
    $status = (psql -U postgres -d antiscam_ticketing -t -A -c "SELECT status FROM escrow_transfers WHERE event_id = $targetEvId LIMIT 1;").Trim()
    if ($status -eq "RELEASED") { $released = $true; break }
}

psql -U postgres -d antiscam_ticketing -c "UPDATE system_settings SET setting_value = '43200' WHERE setting_key = 'ESCROW_HOLD_DURATION_SECONDS';" | Out-Null
if (-not $released) { throw "Timed out waiting for APScheduler release." }
Write-Host "[PASS][ESCROW-01] APScheduler settled Event #$targetEvId to RELEASED." -ForegroundColor Green
'@ | Set-Content -Path "D:\per-por\nikunj_bhaiya\tests\test_escrow_scheduler.ps1" -Encoding UTF8