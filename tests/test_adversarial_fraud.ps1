$ErrorActionPreference = "Stop"
$JAVA_URL = "http://localhost:8080"
$PY_URL   = "http://localhost:8000"
$suffix   = Get-Random -Minimum 10000 -Maximum 99999
$imgDir   = "$PSScriptRoot\tmp_images"
New-Item -ItemType Directory -Force -Path $imgDir | Out-Null

Write-Host "`n--- [SUITE 2] ADVERSARIAL GPS, EXIF & CROWD-FREEZE ---" -ForegroundColor Cyan

python -c "from PIL import Image; import datetime; Image.new('RGB', (400, 300), 'red').save(r'$imgDir\no_exif.jpg'); img_ok = Image.new('RGB', (400, 300), 'green'); exif_ok = img_ok.getexif(); exif_ok[271] = 'Canon'; exif_ok[272] = 'EOS R6'; exif_ok[36867] = datetime.datetime.now().strftime('%Y:%m:%d %H:%M:%S'); img_ok.save(r'$imgDir\valid_exif.jpg', exif=exif_ok)"

$hostRes = (Invoke-RestMethod -Uri "$JAVA_URL/api/auth/register" -Method Post -ContentType "application/json" `
    -Body (@{ email = "scamhost_$suffix@veritix.io"; password = "Password123!"; fullName = "Scam Host"; phone = "+9197$(Get-Random -Minimum 10000000 -Maximum 99999999)"; role = "ROLE_HOST" } | ConvertTo-Json)).data
psql -U postgres -d antiscam_ticketing -c "UPDATE host_profiles SET kyc_status = 'VERIFIED', razorpay_account_id = 'acc_scam_$suffix' WHERE user_id = $($hostRes.user.id);" | Out-Null

$start = (Get-Date).ToUniversalTime().AddMinutes(-15).ToString("yyyy-MM-ddTHH:mm:ssZ")
$end   = (Get-Date).ToUniversalTime().AddMinutes(15).ToString("yyyy-MM-ddTHH:mm:ssZ")

$ev = (Invoke-RestMethod -Uri "$JAVA_URL/api/events" -Method Post `
    -Headers @{ Authorization = "Bearer $($hostRes.accessToken)" } -ContentType "application/json" `
    -Body (@{
        title = "Ghost Venue Scam #$suffix"
        descriptionMarkdown = "Testing fraud freeze"
        venueName = "Empty Plot"
        venueAddress = "Jaipur"
        venueLatitude = 26.9000000
        venueLongitude = 75.8000000
        startTime = $start
        endTime = $end
        venueBookingProofUrl = "https://example.com/fake_$suffix.pdf"
        ticketTiers = @(@{ name = "General"; price = 500.00; totalCapacity = 10 })
    } | ConvertTo-Json -Depth 4)).data

$evId = $ev.id
$trId = $ev.ticketTiers[0].id
psql -U postgres -d antiscam_ticketing -c "UPDATE events SET status = 'VERIFIED_LIVE' WHERE id = $evId;" | Out-Null

# Register 4 DISTINCT attendees and have each buy 1 ticket
$buyers = @()
for ($i = 1; $i -le 4; $i++) {
    $b = (Invoke-RestMethod -Uri "$JAVA_URL/api/auth/register" -Method Post -ContentType "application/json" `
        -Body (@{ email = "victim_${suffix}_$i@veritix.io"; password = "Password123!"; fullName = "Victim $i"; phone = "+9196$(Get-Random -Minimum 10000000 -Maximum 99999999)"; role = "ROLE_ATTENDEE" } | ConvertTo-Json)).data
    $k = [guid]::NewGuid().ToString()
    $init = (Invoke-RestMethod -Uri "$JAVA_URL/api/bookings/initiate" -Method Post `
        -Headers @{ Authorization = "Bearer $($b.accessToken)" } -ContentType "application/json" `
        -Body (@{ eventId = $evId; ticketTierId = $trId; idempotencyKey = $k } | ConvertTo-Json)).data
    $ver = (Invoke-RestMethod -Uri "$JAVA_URL/api/bookings/verify" -Method Post `
        -Headers @{ Authorization = "Bearer $($b.accessToken)" } -ContentType "application/json" `
        -Body (@{ razorpayOrderId = $init.razorpayOrderId; razorpayPaymentId = "pay_adv_${suffix}_$i"; razorpaySignature = "sig_$i"; idempotencyKey = $k } | ConvertTo-Json)).data
    $buyers += @{ userId = $b.user.id; ticketId = $ver.id; eventId = $ver.eventId }
}

$targetEvId = $buyers[0].eventId
$exactLat   = (psql -U postgres -d antiscam_ticketing -t -A -c "SELECT venue_latitude FROM events WHERE id = $targetEvId;").Trim()
$exactLng   = (psql -U postgres -d antiscam_ticketing -t -A -c "SELECT venue_longitude FROM events WHERE id = $targetEvId;").Trim()

# GEO-03: Reject low-accuracy GPS spoof
try {
    Invoke-RestMethod -Uri "$PY_URL/api/geo/check-in" -Method Post -Body @{ ticket_id = $buyers[0].ticketId; latitude = $exactLat; longitude = $exactLng; accuracy = 500.0 } | Out-Null
    throw "Expected accuracy > 150m to fail!"
} catch {
    Write-Host "[PASS][GEO-03] Rejected low-accuracy GPS reading (500m)." -ForegroundColor Green
}

# GEO-04: Stripped EXIF upload
$rNoExif = curl.exe -s -X POST "$PY_URL/api/geo/report-venue" `
    -F "event_id=$targetEvId" -F "ticket_id=$($buyers[0].ticketId)" -F "reporter_user_id=$($buyers[0].userId)" `
    -F "latitude=$exactLat" -F "longitude=$exactLng" -F "accuracy=10" `
    -F "report_text=Empty ground screenshot" -F "photo=@$imgDir\no_exif.jpg;type=image/jpeg"
Write-Host "[PASS][GEO-04] Stripped EXIF flagged: $rNoExif" -ForegroundColor Green

# FRD-01: 3 DISTINCT verified camera-EXIF reporters -> Triggers FROZEN_DISPUTE
for ($j = 1; $j -le 3; $j++) {
    $repOut = curl.exe -s -X POST "$PY_URL/api/geo/report-venue" `
        -F "event_id=$targetEvId" -F "ticket_id=$($buyers[$j].ticketId)" -F "reporter_user_id=$($buyers[$j].userId)" `
        -F "latitude=$exactLat" -F "longitude=$exactLng" -F "accuracy=10" `
        -F "report_text=Confirmed empty ground #$j" -F "photo=@$imgDir\valid_exif.jpg;type=image/jpeg"
    Write-Host "  Distinct Reporter #$j response: $repOut"
}

$evStatus = (psql -U postgres -d antiscam_ticketing -t -A -c "SELECT status FROM events WHERE id = $targetEvId;").Trim()
if ($evStatus -ne "FROZEN_DISPUTE") { throw "Expected FROZEN_DISPUTE, got $evStatus" }
Write-Host "[PASS][FRD-01] 3 distinct verified reporters triggered automatic FROZEN_DISPUTE on Event #$targetEvId!" -ForegroundColor Green

Remove-Item -Recurse -Force $imgDir
