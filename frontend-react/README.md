# Veritix — High-Contrast Editorial Frontend (React + Vite)

> **Editorial High-Contrast User Interface for Anti-Scam Ticketing & Escrow Settlement**  
> Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, and **React Markdown** (`react-markdown` + `rehype-sanitize`). Designed with a luxury editorial aesthetic featuring deep burgundy (`#4A0E1C`), warm gold (`#D4AF37`), and crisp dark slate (`#0B0F17`), providing dedicated dashboards for Attendees, Event Hosts, and Platform Compliance Administrators.

---

## 1. Editorial Design Tokens & Styling Architecture

The frontend styling is configured in [`tailwind.config.js`](file:///d:/per-por/nikunj_bhaiya/frontend-react/tailwind.config.js) and [`src/index.css`](file:///d:/per-por/nikunj_bhaiya/frontend-react/src/index.css):

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `burgundy-700` | `#4A0E1C` | Primary brand background, luxury accents, CTA buttons |
| `burgundy-900` | `#2E060F` | Deep container backgrounds, radial hero gradients |
| `gold-500` | `#D4AF37` | Warm metallic gold accents, borders, icons, prices |
| `gold-400` | `#E5C453` | Highlighted text, active tabs, status indicators |
| `surface-dark` | `#0B0F17` | Root application background, deep dark canvas |
| `surface-card` | `#131A26` | Editorial card surfaces, elevated panels |
| `surface-border`| `#222E40` | Subtle structural dividing borders |

### Typography
- **Headings**: `Cinzel`, `Georgia`, serif (`font-editorial`).
- **Body Text**: `Inter`, system-ui, sans-serif (`font-sans`).
- **Data & Invariants**: `JetBrains Mono`, `monospace` (`font-mono`).

---

## 2. Environment Variables

Variables are loaded dynamically via `import.meta.env` (configured in `.env` or `.env.local`):

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:8080` | URL for the Java Spring Boot Core Financial & RBAC Service |
| `VITE_PYTHON_SERVICE_URL` | `http://localhost:8000` | URL for the Python Geo-Verification & Fraud Microservice |
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_antiscam_key_id`| Razorpay public Key ID for the Checkout SDK |
| `VITE_PORT` | `5173` | Local development port for the Vite server |

---

## 3. Role-Based Routing & Dashboards

The application implements client-side role guards via [`ProtectedRoute.tsx`](file:///d:/per-por/nikunj_bhaiya/frontend-react/src/components/ProtectedRoute.tsx):

```
/ (HomePage)                           # Public: Hero & verified event listing cards
/login (LoginPage)                     # Public: 1-click demo login accounts
/register (RegisterPage)               # Public: Account creation with role selection
/events/:id (EventDetailPage)          # Public: Markdown description, tiers, Razorpay checkout

─── Protected: Attendee (ROLE_ATTENDEE) ──────────────────────────────────────────
/wallet (AttendeeDashboard)            # Ticket wallet, escrow status, refund timeline
/checkin/:ticketId (CheckInPage)       # Real-time GPS verification against venue coords
/report/:ticketId (ReportVenuePage)    # Mobile camera capture & EXIF fraud submission

─── Protected: Organizer (ROLE_HOST, ROLE_ADMIN) ─────────────────────────────────
/host/events (HostDashboard)           # Studio, escrow breakdown, hold timer, cancel
/host/kyc (HostKycPage)                # PAN & bank account onboarding for linked payouts
/host/create-event (CreateEventPage)   # Live Markdown editor, preview & venue pinpicker

─── Protected: Compliance Admin (ROLE_ADMIN) ────────────────────────────────────
/admin (AdminDashboard)                # Host KYC approval queue & venue deeds inspection
/admin/disputes (AdminDisputesPage)    # Forensic dispute center (photo EXIF, manual overrides)
/admin/settings (AdminSettingsPage)    # Real-time dynamic system parameter adjustment
/admin/ledger (AdminLedgerPage)        # Immutable double-entry financial audit trail
```

---

## 4. Key Feature Flows & Components

### 1. Zero-Overselling Atomic Checkout (`EventDetailPage.tsx`)
- Displays live remaining seats per ticket tier (`availableSeats = totalCapacity - (reservedCount + soldCount)`).
- When the user selects a tier, `api.initiateCheckout` sends an idempotency key (UUID v4) to acquire an exclusive row lock on the server.
- Seamlessly triggers Razorpay Checkout SDK (or falls back to an automated test simulator if demo keys are used).

### 2. Cryptographic QR Pass Generator (`QrCodeModal.tsx`)
- Renders an interactive, high-resolution QR canvas generated from the ticket's HMAC-SHA256 signature token.
- Includes a center watermark crest (`VTX`), ticket pass number, and verification badges.

### 3. High-Accuracy GPS Check-In (`CheckInPage.tsx`)
- Invokes `navigator.geolocation.getCurrentPosition({ enableHighAccuracy: true })`.
- Displays real-time device coordinates, accuracy error radius (enforcing $\le 150\text{m}$), and client-side Haversine distance to the venue.
- Submits telemetry to `POST /api/geo/check-in` on the Python service.

### 4. Forensic Camera Fraud Reporting (`ReportVenuePage.tsx`)
- Native camera capture using `<input type="file" accept="image/*" capture="environment">`.
- Captures live photos, extracts client-side preview, acquires current GPS coordinates, and submits multipart form data to `POST /api/geo/report-venue`.
- Displays real-time feedback: EXIF camera validity, distance from venue, and whether the automatic crowd-consensus freeze was triggered.

### 5. Escrow Clearance Countdown Timer (`CountdownTimer.tsx`)
- Displays real-time ticking countdown (`HH:MM:SS`) to `event_end_time + 12 hours`.
- Highlights that organizer personal/external bank balances are untouched while ticket proceeds remain locked in the multi-sig escrow pool.

---

## 5. Development & Build Commands

### Install Dependencies
```powershell
cd frontend-react
npm install
```

### Start Development Server
```powershell
npm run dev
```
The server will start at `http://localhost:5173`.

### Production Build
```powershell
npm run build
```
Generates an optimized, minified production bundle in `frontend-react/dist/`.

### Preview Production Build
```powershell
npm run preview
```
