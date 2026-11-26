$ErrorActionPreference = "Stop"
$JAVA_URL = "http://localhost:8080"
$PY_URL   = "http://localhost:8000"
$suffix   = Get-Random -Minimum 10000 -Maximum 99999

Write-Host "`n--- [SUITE 1] E2E HAPPY PATH & ESCROW SPLIT ---" -ForegroundColor Cyan

function Register-TestUser($email, $name, $role) {
    $res = Invoke-RestMethod -Uri "$JAVA_URL/api/auth/register" -Method Post -ContentType "application/json" `
        -Body (@{
            email    = $email
            password = "Password123!"
            fullName = $name
            phone    = "+9198$(Get-Random -Minimum 10000000 -Maximum 99999999)"
            role     = $role
        } | ConvertTo-Json)
    return $res.data
}

$hostData     = Register-TestUser "host_e2e_$suffix@veritix.io" "E2E Host" "ROLE_HOST"
$attendeeData = Register-TestUser "user_e2e_$suffix@veritix.io" "E2E Attendee" "ROLE_ATTENDEE"

psql -U postgres -d antiscam_ticketing -c "UPDATE host_profiles SET kyc_status = 'VERIFIED', razorpay_account_id = 'acc_e2e_$suffix' WHERE user_id = $($hostData.user.id);" | Out-Null

$start = (Get-Date).ToUniversalTime().AddMinutes(-10).ToString("yyyy-MM-ddTHH:mm:ssZ")
$end   = (Get-Date).ToUniversalTime().AddMinutes(15).ToString("yyyy-MM-ddTHH:mm:ssZ")

$ev = (Invoke-RestMethod -Uri "$JAVA_URL/api/events" -Method Post `
    -Headers @{ Authorization = "Bearer $($hostData.accessToken)" } -ContentType "application/json" `
    -Body (@{
        title                = "E2E Happy Path Summit #$suffix"
        descriptionMarkdown  = "# Verified Event`nEscrow split test."
        venueName            = "Tech Convention Hall"
        venueAddress         = "Jaipur, Rajasthan"
        venueLatitude        = 26.8361000
        venueLongitude       = 75.6502000
        startTime            = $start
        endTime              = $end
        venueBookingProofUrl = "https://example.com/deed_$suffix.pdf"
        ticketTiers          = @(@{ name = "Standard"; price = 1000.00; totalCapacity = 20 })
    } | ConvertTo-Json -Depth 4)).data

$evId = $ev.id
$trId = $ev.ticketTiers[0].id
psql -U postgres -d antiscam_ticketing -c "UPDATE events SET status = 'VERIFIED_LIVE' WHERE id = $evId;" | Out-Null

$idempKey = [guid]::NewGuid().ToString()
$init = (Invoke-RestMethod -Uri "$JAVA_URL/api/bookings/initiate" -Method Post `
    -Headers @{ Authorization = "Bearer $($attendeeData.accessToken)" } -ContentType "application/json" `
    -Body (@{ eventId = $evId; ticketTierId = $trId; idempotencyKey = $idempKey } | ConvertTo-Json)).data

$ticket = (Invoke-RestMethod -Uri "$JAVA_URL/api/bookings/verify" -Method Post `
    -Headers @{ Authorization = "Bearer $($attendeeData.accessToken)" } -ContentType "application/json" `
    -Body (@{
        razorpayOrderId   = $init.razorpayOrderId
        razorpayPaymentId = "pay_e2e_$suffix"
        razorpaySignature = "sig_e2e_$suffix"
        idempotencyKey    = $idempKey
    } | ConvertTo-Json)).data

if ($ticket.status -ne "PAID_HELD_IN_ESCROW") { throw "Expected PAID_HELD_IN_ESCROW, got $($ticket.status)" }
Write-Host "[PASS] Ticket #$($ticket.id) issued in PAID_HELD_IN_ESCROW state." -ForegroundColor Green

$dupTicket = (Invoke-RestMethod -Uri "$JAVA_URL/api/bookings/verify" -Method Post `
    -Headers @{ Authorization = "Bearer $($attendeeData.accessToken)" } -ContentType "application/json" `
    -Body (@{
        razorpayOrderId   = $init.razorpayOrderId
        razorpayPaymentId = "pay_e2e_$suffix"
        razorpaySignature = "sig_e2e_$suffix"
        idempotencyKey    = $idempKey
    } | ConvertTo-Json)).data

if ($dupTicket.id -ne $ticket.id) { throw "Idempotency failed: created duplicate ticket!" }
Write-Host "[PASS] Duplicate verify request returned original Ticket #$($dupTicket.id)." -ForegroundColor Green

# Query the exact stored venue coordinates for this ticket's event
$actualEvId = (psql -U postgres -d antiscam_ticketing -t -A -c "SELECT event_id FROM tickets WHERE id = $($ticket.id);").Trim()
$exactLat   = (psql -U postgres -d antiscam_ticketing -t -A -c "SELECT venue_latitude FROM events WHERE id = $actualEvId;").Trim()
$exactLng   = (psql -U postgres -d antiscam_ticketing -t -A -c "SELECT venue_longitude FROM events WHERE id = $actualEvId;").Trim()

$checkin = Invoke-RestMethod -Uri "$PY_URL/api/geo/check-in" -Method Post `
    -Body @{ ticket_id = $ticket.id; latitude = $exactLat; longitude = $exactLng; accuracy = 10.0 }
if (-not $checkin.success) { throw "Valid GPS check-in failed" }
Write-Host "[PASS] GPS check-in succeeded at $([math]::Round($checkin.distance_meters, 2))m (Event #$actualEvId)." -ForegroundColor Green
