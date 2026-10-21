# MarketHub — Multi-Vendor E-Commerce Marketplace

MarketHub is a scalable, secure, enterprise-grade multi-vendor e-commerce platform built with **Next.js 14/15**, **NestJS 10**, **PostgreSQL**, **Prisma ORM**, and **Redis**. It provides seamless cross-vendor shopping for customers, comprehensive storefront operations for sellers, dispatched fulfillment for delivery partners, and administrative governance.

---

## 🚀 Key Features

- **Multi-Vendor Cart & Atomic Checkout**: Customers can purchase products from multiple independent vendors in a single checkout.
- **Parent Order / Sub-Order Splitting**: Checkouts atomically create a Parent Order for the customer and isolate Sub-Orders for each vendor.
- **Pessimistic Inventory Locking**: Zero-overselling guarantee with row-level reservation locks and 15-minute TTL expirations.
- **Financial Precision**: All monetary calculations use integer minor units (INR Paise: `100 paise = ₹1.00`) to prevent IEEE-754 rounding errors.
- **Automated Commission Engine**: Real-time commission deduction and net vendor payout calculation based on basis points (`bps`).
- **Delivery Workflow State Machine**: Status-based dispatch tracking (`ASSIGNED -> PICKED_UP -> IN_TRANSIT -> DELIVERED`).
- **Four Distinct Role Portals**: Dedicated, permission-isolated interfaces for **Customers**, **Vendors**, **Delivery Partners**, and **Administrators**.
- **Security & Compliance**: Short-lived JWTs, rotated HttpOnly refresh tokens, Argon2/bcrypt password hashing, DTO validation, IDOR prevention, and immutable audit logging.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14+ (App Router), React 18/19, TypeScript | High-performance, responsive SSR/CSR user interfaces |
| **Styling** | Tailwind CSS, Lucide Icons | Modern, accessible glassmorphic UI |
| **Backend** | NestJS 10, TypeScript | Modular, scalable enterprise REST API |
| **Database** | PostgreSQL 16+, Prisma ORM | Relational persistence, transactions, migrations |
| **Caching** | Redis (with in-memory fallback) | Rate limiting, cache, reservation TTLs |
| **Storage** | S3-Compatible Storage & Local Adapter | Secure product image storage |
| **Documentation** | Swagger / OpenAPI 3.0 | Interactive API documentation at `/api/docs` |

---

## 📂 Repository Structure

```
markethub/
├── apps/
│   ├── api/             # NestJS REST API (Port 4000)
│   └── web/             # Next.js Frontend (Port 3000)
├── packages/
│   └── shared/          # Shared types, DTO contracts, money utils
├── docs/                # Architecture, DB Schema, Security specs
├── docker-compose.yml   # Local PostgreSQL, Redis, MinIO services
├── .env.example         # Environment template
└── package.json         # Monorepo workspaces
```

---

## ⚙️ Quickstart & Local Setup

### 1. Prerequisites
- Node.js >= 20.x (Node v24.x supported)
- npm >= 10.x
- PostgreSQL 16+ (or Docker)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 4. Database Setup & Migrations
```bash
# Push database schema or run migrations
npm run prisma:generate
npm run prisma:push

# Seed initial test data (Admin, Vendors, Categories, Products, Delivery Partners)
npm run prisma:seed
```

### 5. Running the Application
```bash
# Start backend API (http://localhost:4000)
npm run dev:api

# Start frontend Web App (http://localhost:3000)
npm run dev:web
```

- **Swagger API Docs**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **Marketplace Web**: [http://localhost:3000](http://localhost:3000)

---

## 👥 Seed Demo Credentials

| Role | Email | Password | Access Portal |
|---|---|---|---|
| **Admin** | `admin@markethub.com` | `Admin@123456` | `/admin` |
| **Vendor 1** | `techstore@vendor.com` | `Vendor@123456` | `/vendor` |
| **Vendor 2** | `fashionhub@vendor.com` | `Vendor@123456` | `/vendor` |
| **Customer** | `john.doe@example.com` | `Customer@123456`| Customer storefront |
| **Delivery Partner** | `rider1@delivery.com` | `Rider@123456` | `/delivery` |

---

## 🧪 Testing

```bash
# Run backend unit & integration tests
npm run test:api
```
