# MarketHub — REST API Specification
**Base URL**: `/api/v1`  
**API Specification Standard**: OpenAPI 3.0 / Swagger (accessible via `/api/docs`)  
**Data Exchange Format**: JSON (`application/json`)  

---

## 1. Global Conventions

### Response Envelope Pattern
All API responses follow a consistent envelope structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Resource retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["priceMinor must be an integer", "sku is required"],
  "timestamp": "2026-10-11T12:00:00.000Z",
  "path": "/api/v1/products"
}
```

---

## 2. API Endpoint Matrix

### A. Authentication & User Profile (`/auth`, `/users`)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register customer, vendor, or delivery partner |
| POST | `/auth/login` | Public | Authenticate user, return JWT + HttpOnly refresh cookie |
| POST | `/auth/refresh` | Public | Rotate refresh token, issue fresh access token |
| POST | `/auth/logout` | Authenticated | Revoke refresh token |
| GET | `/users/me` | Authenticated | Retrieve current user profile and role details |
| PUT | `/users/me` | Authenticated | Update profile details (name, phone) |
| GET | `/users/me/addresses` | Customer | List saved delivery addresses |
| POST | `/users/me/addresses` | Customer | Create delivery address |
| DELETE | `/users/me/addresses/:id` | Customer (Owner) | Delete address |

### B. Catalog & Browsing (`/products`, `/categories`)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/categories` | Public | Get hierarchical category tree |
| GET | `/products` | Public | Search, filter, and paginate products (`q`, `category`, `vendor`, `minPrice`, `maxPrice`, `sort`) |
| GET | `/products/:slug` | Public | Get product details, images, seller info, stock status |
| GET | `/products/:id/reviews`| Public | Get approved reviews for product |

### C. Cart & Checkout (`/cart`, `/checkout`)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/cart` | Customer / Session | Get current cart with live inventory check & vendor groupings |
| POST | `/cart/items` | Customer / Session | Add product to cart (`productId`, `quantity`) |
| PATCH | `/cart/items/:id` | Customer / Session | Update quantity |
| DELETE | `/cart/items/:id` | Customer / Session | Remove item from cart |
| POST | `/checkout/initialize`| Customer | Atomic stock reservation, compute totals, create parent + suborders |
| POST | `/checkout/confirm` | Customer | Submit payment verification / confirm mock payment |

### D. Orders (`/orders`)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/orders` | Customer | List customer's parent orders |
| GET | `/orders/:id` | Customer (Owner) | Get parent order details with suborders & tracking |
| POST | `/orders/:id/cancel` | Customer (Owner) | Request cancellation if within eligible window |

### E. Vendor Portal (`/vendors`)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/vendors/register` | Authenticated | Submit vendor onboarding application |
| GET | `/vendors/profile` | Vendor | Get vendor store profile & approval status |
| PUT | `/vendors/profile` | Vendor | Update store description, logo, banner |
| GET | `/vendors/products` | Vendor | List vendor's own products with stock levels |
| POST | `/vendors/products` | Vendor | Create new product |
| PUT | `/vendors/products/:id`| Vendor (Owner) | Update product details, price, SKU |
| PATCH | `/vendors/products/:id/stock`| Vendor (Owner)| Adjust physical stock / restock |
| GET | `/vendors/orders` | Vendor | List vendor orders assigned to this vendor |
| GET | `/vendors/orders/:id` | Vendor (Owner) | Get sub-order details (items, shipping snapshot) |
| PATCH | `/vendors/orders/:id/status`| Vendor (Owner)| Advance sub-order status (`CONFIRMED -> PREPARING -> READY_FOR_PICKUP`) |
| GET | `/vendors/analytics`| Vendor | Revenue, commissions, low-stock warnings |

### F. Delivery Partner Portal (`/delivery`)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/delivery/available`| Delivery Partner | List orders ready for pickup in area |
| POST | `/delivery/:id/claim`| Delivery Partner | Claim delivery assignment |
| GET | `/delivery/my-jobs` | Delivery Partner | List assigned active and past deliveries |
| PATCH | `/delivery/:id/status`| Delivery Partner (Owner)| Transition status (`PICKED_UP -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED`) |

### G. Administration & Governance (`/admin`)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/admin/analytics` | Admin | Platform GMV, orders count, vendor counts, commission earnings |
| GET | `/admin/vendors` | Admin | List all vendors with filter by status (`PENDING_APPROVAL`, etc.) |
| PATCH | `/admin/vendors/:id/status`| Admin | Approve, Reject, or Suspend vendor |
| PATCH | `/admin/vendors/:id/commission`| Admin | Set custom commission rate for vendor |
| GET | `/admin/orders` | Admin | View all parent orders and suborders platform-wide |
| GET | `/admin/audit-logs` | Admin | Paginated security and moderation audit trails |
| POST | `/admin/categories` | Admin | Create/manage taxonomy categories |
