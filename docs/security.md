# MarketHub — Security Architecture & Threat Model
**Standard Compliance**: OWASP Top 10 (2021), NIST 800-63B Authentication Guidelines  
**Classification**: Enterprise Confidential  

---

## 1. Threat Modeling & Core Defense Mechanisms

| Threat Category | Potential Attack Vector | MarketHub Architectural Defense |
|---|---|---|
| **Insecure Direct Object References (IDOR)** | Malicious vendor tampering with `/vendors/orders/:id` using another vendor's sub-order ID. | **Backend Ownership Enforcement**: Route handlers extract `user.id` or `vendor.id` from verified JWT claims. Prisma queries strictly bind `WHERE id = :id AND vendorId = :userVendorId`. |
| **Race Conditions / Overselling** | Two customers purchasing the last available inventory item simultaneously. | **Pessimistic Concurrency**: Atomic transaction locking with `SELECT ... FOR UPDATE` on `Inventory` row, or atomic decrement `WHERE quantity - reservedQuantity >= :requestedQty`. |
| **Price Tampering** | Client tampering with `totalPrice` in checkout request payload. | **Zero-Trust Pricing**: Checkout ignores client-submitted price totals. Server queries database for current `Product.priceMinor` and computes all totals, shipping, and commissions server-side. |
| **Payment Spoofing** | Attacker submitting fake payment confirmation payloads. | **Cryptographic Verification**: Webhooks verified via HMAC-SHA256 with provider secret; idempotent event recording in `PaymentEvent` table to reject duplicate replays. |
| **Broken Authentication** | Credential stuffing, brute-force attacks, token interception. | **Argon2id/Bcrypt Hashing**: Minimum 12 salt rounds. Short-lived Access Tokens (15 min) paired with HttpOnly, Secure, SameSite=Strict Refresh Tokens with family rotation and revocation tracking. |
| **Privilege Escalation** | Customer modifying payload to grant `ADMIN` role. | **Immutable Role Context**: User roles are never accepted from request payloads; resolved exclusively from verified server session context via NestJS `RolesGuard`. |
| **Cross-Site Scripting (XSS)** | Vendor injecting malicious script into product description. | **Input Sanitization & Output Encoding**: Server-side DOMPurify/HTML sanitization on product rich-text, React automatic JSX escaping. |
| **SQL Injection** | SQL injection via search or filter inputs. | **Parameterized Queries**: 100% of queries use Prisma ORM parameterized statements; raw SQL strictly forbidden unless safely parameterized. |

---

## 2. Authentication & Session Security

### Token Architecture
1. **Access Token (JWT)**:
   - Lifespan: **15 minutes**.
   - Payload: `{ sub: string, email: string, role: Role, vendorId?: string }`.
   - Signed using `HMAC-SHA256` (`JWT_SECRET`).
2. **Refresh Token**:
   - Lifespan: **7 days**.
   - Stored in database as a SHA-256 hash (`RefreshToken.tokenHash`).
   - Delivered to browser via `HttpOnly`, `Secure` (in production), `SameSite=Lax` cookie.
   - On refresh, the token is invalidated and a fresh pair is minted. If an already revoked token is used, the entire token family is immediately revoked (compromise detection).

---

## 3. Audit Logging Standard

Every sensitive administrative and financial event is recorded in the append-only `AuditLog` table:
- Vendor account status changes (`APPROVED`, `SUSPENDED`).
- Manual inventory balance overrides.
- Commission rate alterations.
- Order cancellations and refunds.
- Admin role assignments.

Each log captures:
`{ actorId, actorRole, action, entityName, entityId, ipAddress, userAgent, metadata: { before, after } }`.
