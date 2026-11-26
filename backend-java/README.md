# Veritix — Core Financial & RBAC Service (Java Spring Boot)

> **Core Financial Engine, RBAC Authorization & Pessimistic Concurrency Service**  
> Built with **Java 21 LTS**, **Spring Boot 3.3.5**, **Spring Data JPA**, **Spring Security (Stateless JWT)**, and **HikariCP**. Responsible for user authentication, event lifecycle management, zero-overselling ticket reservations under concurrent load, double-entry financial ledger accounting, and Razorpay Route escrow split order creation.

---

## 1. Package Layout & Module Organization

The service is located under `src/main/java/com/antiscam/ticketing/`:

```
com.antiscam.ticketing/
├── AntiScamTicketingApplication.java        # Spring Boot main entrypoint (@EnableScheduling)
├── config/
│   ├── CorsConfig.java                     # Dynamic CORS configuration loaded from environment
│   ├── JwtAuthenticationFilter.java        # OncePerRequestFilter parsing Authorization: Bearer <token>
│   ├── JwtService.java                     # JJWT 0.12.6 HMAC-SHA256 token generation & validation
│   ├── SecurityConfig.java                 # Stateless security filter chain & endpoint authorization rules
│   └── SystemSettingsCache.java            # Dynamic parameter cache querying system_settings table
├── controller/                             # REST API Controllers
│   ├── AdminController.java                # KYC queue, event approval, dispute overrides, settings, ledger
│   ├── AuthController.java                 # Registration, login, JWT token refresh, current user profile
│   ├── BookingController.java              # Atomic checkout initiate, payment verify, ticket wallet
│   ├── EventController.java                # Public event discovery and host event management
│   ├── HealthController.java               # Microservice health check endpoint
│   ├── HostController.java                 # Host KYC submission, escrow breakdown, self-service cancellation
│   └── WebhookController.java              # Razorpay raw payload HMAC-SHA256 webhook ingestion
├── dto/                                    # Strongly typed request/response transfer objects
│   ├── ApiResponse.java                    # Unified JSON response wrapper {success, message, data, timestamp}
│   ├── AuthRequests.java & AuthResponses.java
│   ├── CheckoutDTOs.java                   # Checkout initiate, payment verify, ticket detail representations
│   ├── EscrowDTOs.java                     # Financial breakdown, dispute actions, system setting updates
│   └── EventRequests.java & EventResponses.java
├── entity/                                 # JPA Entities mapping to PostgreSQL 16 schema
│   ├── DisputeStatus.java                  # PENDING_REVIEW, RESOLVED_SCAM_CONFIRMED, DISMISSED_FALSE_REPORT
│   ├── EscrowStatus.java                   # ON_HOLD, FROZEN_DISPUTE, RELEASED, REFUNDED
│   ├── EscrowTransfer.java                 # Tracks gross amount, fees, net payout, and release timestamp
│   ├── Event.java & EventStatus.java       # DRAFT, PENDING_VERIFICATION, VERIFIED_LIVE, CANCELED, etc.
│   ├── ExifStatus.java                     # VERIFIED_VALID, SUSPECT_METADATA_MISSING, TAMPERED_TIMESTAMPS
│   ├── HostProfile.java & KycStatus.java   # PAN, bank account, IFSC, entity type, linked vendor ID
│   ├── LedgerEntry.java & LedgerEntryType.java # Immutable double-entry ledger entries
│   ├── Role.java                           # ROLE_ATTENDEE, ROLE_HOST, ROLE_ADMIN
│   ├── SystemSetting.java                  # Dynamic key-value configuration rows
│   ├── Ticket.java & TicketStatus.java     # Individual ticket with signed QR token and status
│   ├── TicketTier.java                     # Price, total capacity, reserved count, sold count, version
│   ├── User.java                           # Email, password hash, role, account status
│   └── WebhookLog.java                     # Ingested gateway webhook payloads and signature verification status
├── repository/                             # Spring Data JPA Repositories
│   ├── EscrowTransferRepository.java
│   ├── EventRepository.java
│   ├── HostProfileRepository.java
│   ├── LedgerEntryRepository.java
│   ├── SystemSettingRepository.java
│   ├── TicketRepository.java
│   ├── TicketTierRepository.java           # Features @Lock(LockModeType.PESSIMISTIC_WRITE) query
│   ├── UserRepository.java
│   ├── VenueDisputeRepository.java
│   └── WebhookLogRepository.java
└── service/                                # Core Domain Services
    ├── AuthService.java                    # Authentication, registration, token refresh logic
    ├── EventService.java                   # Event creation with escrow release math, listing queries
    ├── HostKycService.java                 # KYC submission, linked account ID generation, verification
    ├── LedgerService.java                  # Idempotent double-entry financial ledger records
    ├── RazorpayRouteService.java           # Razorpay Route split hold order creation & HMAC verification
    ├── SystemSettingService.java           # Real-time runtime configuration management
    └── TicketBookingService.java           # Zero-overselling atomic booking & ticket issuance engine
```

---

## 2. Spring Security & RBAC Filter Rules

Authentication is stateless and uses JSON Web Tokens (JWT). The filter chain is defined in [`SecurityConfig.java`](file:///d:/per-por/nikunj_bhaiya/backend-java/src/main/java/com/antiscam/ticketing/config/SecurityConfig.java):

```java
http
    .cors(cors -> cors.configurationSource(corsConfigurationSource))
    .csrf(AbstractHttpConfigurer::disable)
    .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    .authorizeHttpRequests(auth -> auth
        // Public endpoints
        .requestMatchers("/api/health").permitAll()
        .requestMatchers("/api/auth/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/events").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/events/*").permitAll()
        .requestMatchers("/api/webhooks/**").permitAll()
        // Host-protected endpoints
        .requestMatchers("/api/host/**").hasAnyAuthority("ROLE_HOST", "ROLE_ADMIN")
        .requestMatchers(HttpMethod.POST, "/api/events").hasAnyAuthority("ROLE_HOST", "ROLE_ADMIN")
        // Admin-protected endpoints
        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
        // All other requests require valid JWT authentication
        .anyRequest().authenticated()
    )
    .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
```

### Password Hashing & Secret Specification
- Passwords are encrypted with standard `BCryptPasswordEncoder` (10 salt rounds).
- JWTs are generated and validated using JJWT 0.12.6 with an HMAC-SHA256 256-bit secret key (`app.jwt.secret`).
- Access tokens expire after $24\text{ hours}$ (`86,400,000` ms default).
- Refresh tokens expire after $7\text{ days}$ (`604,800,000` ms default).

---

## 3. Concurrency Control: Zero Overselling via Pessimistic Row Locking

Standard optimistic locking (`@Version`) throws `OptimisticLockException` under high contention, resulting in failed transactions and poor user experience. Veritix prevents overselling at the database engine level using pessimistic write locks:

### 1. Repository Query Definition
In [`TicketTierRepository.java`](file:///d:/per-por/nikunj_bhaiya/backend-java/src/main/java/com/antiscam/ticketing/repository/TicketTierRepository.java#L23-L27):
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT t FROM TicketTier t WHERE t.id = :id")
Optional<TicketTier> findByIdForUpdate(@Param("id") Long id);
```

### 2. Atomic Reservation Transaction
In [`TicketBookingService.java`](file:///d:/per-por/nikunj_bhaiya/backend-java/src/main/java/com/antiscam/ticketing/service/TicketBookingService.java#L69-L87):
1. **Idempotency Check**: If a booking with the same `idempotency_key` exists, return the existing order immediately without re-locking inventory.
2. **Pessimistic Row Lock**: Execute `SELECT ... FOR UPDATE` on the specified `TicketTier`.
3. **Capacity Check**:
   $$\text{availableSeats} = \text{totalCapacity} - (\text{reservedCount} + \text{soldCount})$$
   If $\text{availableSeats} \le 0$, throw `IllegalStateException("Selected ticket tier is completely SOLD OUT.")`.
4. **Increment Reserved Count**: `reservedCount` is incremented and saved within the locked transaction.
5. **Split Hold Order Creation**: The order is created with the payment gateway with hold parameters before releasing the row lock.
6. **Payment Verification**: When payment succeeds, `reservedCount` is decremented and `soldCount` is atomically incremented.

---

## 4. Payment Gateway & Webhook Signature Verification

### Razorpay Route Split Payment Model
In [`RazorpayRouteService.java`](file:///d:/per-por/nikunj_bhaiya/backend-java/src/main/java/com/antiscam/ticketing/service/RazorpayRouteService.java#L47-L64):
- Payouts are routed to the host's linked account (`acc_xxx`) with:
  - `on_hold: true`
  - `on_hold_until: epochTimestamp` ($12\text{ hours}$ after event end time)
- **Fee Split Calculation**:
  $$\text{Gross Amount} = \text{Tier Price}$$
  $$\text{Platform Fee} = \text{Gross} \times \frac{\text{Platform Commission \%}}{100}$$
  $$\text{Gateway Fee} = \text{Gross} \times 0.02 \quad (2\%)$$
  $$\text{Net Payout} = \text{Gross} - \text{Platform Fee} - \text{Gateway Fee}$$

### HMAC-SHA256 Cryptographic Verification
- **Payment Signature**:
  $$\text{Signature} = \text{HMAC-SHA256}(\text{order\_id} + "|" + \text{payment\_id}, \text{key\_secret})$$
- **Webhook Ingestion**:
  $$\text{Expected Signature} = \text{HMAC-SHA256}(\text{rawRequestBody}, \text{webhook\_secret})$$
  Evaluated in [`WebhookController.java`](file:///d:/per-por/nikunj_bhaiya/backend-java/src/main/java/com/antiscam/ticketing/controller/WebhookController.java#L32-L48) using constant-time string comparison (`MessageDigest.isEqual`) to prevent timing attacks.

---

## 5. Complete REST API Reference

| HTTP Method | Path | Required Role | Request Body / Parameters | Description |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Public | `RegisterRequest` (email, password, fullName, phone, role) | Registers attendee or host account |
| **POST** | `/api/auth/login` | Public | `LoginRequest` (email, password) | Authenticates user; returns JWT access & refresh tokens |
| **POST** | `/api/auth/refresh` | Public | `RefreshRequest` (refreshToken) | Issues fresh access token from valid refresh token |
| **GET** | `/api/auth/me` | Authenticated | None (Bearer Token) | Returns current authenticated user profile & KYC status |
| **GET** | `/api/events` | Public | None | Lists all `VERIFIED_LIVE` public events |
| **GET** | `/api/events/{id}` | Public | Path variable: `id` | Returns event details, Markdown, and ticket tiers |
| **POST** | `/api/events` | `ROLE_HOST`, `ROLE_ADMIN` | `CreateEventRequest` (title, markdown, venue, tiers, proofUrl) | Creates new event (requires verified host KYC) |
| **GET** | `/api/events/host/my-events`| `ROLE_HOST`, `ROLE_ADMIN` | None (Bearer Token) | Lists events created by the logged-in host |
| **POST** | `/api/bookings/initiate` | Authenticated | `CheckoutInitiateRequest` (eventId, ticketTierId, idempotencyKey) | Pessimistic reservation & split hold order creation |
| **POST** | `/api/bookings/verify` | Authenticated | `PaymentVerifyRequest` (orderId, paymentId, signature, idempotencyKey) | Verifies payment, issues signed QR ticket, logs to ledger |
| **GET** | `/api/bookings/my-tickets`| Authenticated | None (Bearer Token) | Retrieves attendee's purchased tickets & escrow badges |
| **GET** | `/api/bookings/ticket/{id}`| Authenticated | Path variable: `id` | Fetches single ticket pass with HMAC signature |
| **POST** | `/api/host/kyc` | `ROLE_HOST`, `ROLE_ADMIN` | `HostKycRequest` (pan, bankAccount, ifsc, businessName, entityType, docUrl) | Submits host KYC & links Route account |
| **GET** | `/api/host/kyc` | `ROLE_HOST`, `ROLE_ADMIN` | None (Bearer Token) | Returns current host profile KYC state |
| **GET** | `/api/host/escrow-breakdown/{id}` | `ROLE_HOST`, `ROLE_ADMIN` | Path variable: `id` (eventId) | Real-time sales, platform/gateway fees, hold countdown |
| **POST** | `/api/host/cancel-event/{id}` | `ROLE_HOST`, `ROLE_ADMIN` | Path variable: `id` (eventId) | Self-service cancellation triggering instant bulk refunds |
| **GET** | `/api/admin/kyc-queue` | `ROLE_ADMIN` | None | Lists pending host KYC applications |
| **POST** | `/api/admin/verify-kyc/{id}` | `ROLE_ADMIN` | Query: `approve=bool`, `reason=str` | Approves or rejects host KYC profile |
| **GET** | `/api/admin/events-queue` | `ROLE_ADMIN` | None | Lists all events for administrative review |
| **POST** | `/api/admin/verify-event/{id}` | `ROLE_ADMIN` | Query: `approve=bool` | Approves event listing to `VERIFIED_LIVE` |
| **GET** | `/api/admin/disputes` | `ROLE_ADMIN` | None | Lists all crowd-submitted venue fraud disputes |
| **POST** | `/api/admin/dispute-action` | `ROLE_ADMIN` | `DisputeActionRequest` (eventId, action, adminNotes) | `FORCE_FREEZE_AND_REFUND` or `DISMISS_DISPUTE_AND_RELEASE` |
| **GET** | `/api/admin/settings` | `ROLE_ADMIN` | None | Returns all dynamic system settings |
| **PUT** | `/api/admin/settings` | `ROLE_ADMIN` | `SystemSettingUpdateDTO` (key, value, description) | Updates system parameters live in PostgreSQL |
| **GET** | `/api/admin/ledger` | `ROLE_ADMIN` | None | Returns immutable double-entry audit ledger log |
| **POST** | `/api/webhooks/razorpay` | Public | Raw payload + `X-Razorpay-Signature` header | Verifies and logs payment gateway webhooks |
| **GET** | `/api/health` | Public | None | Health check reporting service status & architecture |

---

## 6. Configuration & HikariCP Connection Pool

Configuration is managed in [`src/main/resources/application.yml`](file:///d:/per-por/nikunj_bhaiya/backend-java/src/main/resources/application.yml):

```yaml
server:
  port: ${SERVER_PORT:8080}

spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/antiscam_ticketing}
    username: ${SPRING_DATASOURCE_USERNAME:postgres}
    password: ${SPRING_DATASOURCE_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: ${SPRING_DATASOURCE_HIKARI_MAX_POOL_SIZE:50}
      minimum-idle: ${SPRING_DATASOURCE_HIKARI_MIN_IDLE:10}
      idle-timeout: ${SPRING_DATASOURCE_HIKARI_IDLE_TIMEOUT:30000}
      connection-timeout: ${SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT:20000}
      pool-name: AntiScamHikariPool
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        jdbc:
          batch_size: 25
        order_inserts: true
        order_updates: true
```

---

## 7. Build & Execution Commands

### Compile and Verify
```powershell
mvn -f backend-java\pom.xml clean compile
```

### Run Native Service
```powershell
mvn -f backend-java\pom.xml spring-boot:run
```

The service will bind to `http://localhost:8080`.
