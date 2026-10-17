# The Growth Archive

> **Production-Grade Digital Marketing Digital-Products Store**  
> *Practical field notes, action playbooks, operational templates, wireframe guides, and real-world growth experiment post-mortems.*

Built with Next.js 15 (App Router), TypeScript, Vanilla CSS Editorial Design System, Prisma ORM (SQLite / PostgreSQL ready), server-authoritative Razorpay Standard Checkout, cryptographic download entitlements, purchase recovery, and a secure administration control center.

---

## 1. Architectural Principles & Design System

- **Editorial Stance**: Designed with the typographic maturity of an independent publishing house. Restrained color palette (Warm Ivory `#FBF9F5`, Obsidian Ink `#121417`, hairline borders `#E2DDD3`, and subtle category accents).
- **Zero AI Fluff**: No random gradients, no floating 3D spheres, no fake "10,000+ happy students" counters. The visual identity communicates verified operational experience.
- **Server-Authoritative Pricing**: The frontend never determines the price. Every order is validated against the database model, authoritative coupons, and signed on the server before reaching payment gateways.
- **Cryptographic File Delivery**: Product files are stored in private storage (`storage/products/`, never in `/public`). Downloads are authorized via 256-bit SHA-256 hashed single-use/expiring tokens that enforce download counts and audit logs.

---

## 2. Tech Stack

- **Framework**: Next.js 16.3.5 (App Router, Turbopack)
- **Language**: TypeScript 5.9
- **Styling**: Vanilla CSS with Design Tokens (`src/styles/globals.css`) & CSS Modules
- **Database & ORM**: Prisma 6.19 with SQLite (`file:./dev.db`)
- **Payment Gateway**: Razorpay Standard Checkout SDK + Server Signature Verification (HMAC-SHA256) + Built-in Local Test Simulator
- **Icons**: Lucide React
- **Email Delivery**: Pluggable transactional email service (Resend / SMTP / Console fallback)
- **Analytics**: Google Analytics 4 (`view_item`, `begin_checkout`, `purchase`) & Meta Pixel (`ViewContent`, `InitiateCheckout`, `Purchase`)

---

## 3. Directory Structure

```text
MMDP/
├── prisma/
│   ├── schema.prisma         # Prisma database schema (Products, Orders, Customers, Entitlements, Coupons)
│   └── seed.ts               # Seed catalog: 10 core products + 2 curated bundles + coupons
├── storage/
│   └── products/             # PRIVATE binary storage (PDFs, ZIPs). NEVER exposed directly to public URLs.
├── scripts/
│   └── generate-assets.ts    # Standalone asset generator producing valid PDF product files
├── src/
│   ├── app/
│   │   ├── page.tsx          # Editorial Homepage (Hero, Trust, Featured, Categories, Bundle, FAQ)
│   │   ├── store/page.tsx    # Catalog Browser with real-time category filtering, search, and sorting
│   │   ├── products/[slug]/  # Deep-dive Product Detail page (Curriculum, Sample Preview, Tech Specs, Buy Box)
│   │   ├── orders/success/   # Post-payment confirmation page with 1-click tokenized download buttons
│   │   ├── purchases/        # Purchase Recovery & Re-Download portal with 6-digit OTP email verification
│   │   ├── admin/page.tsx    # Authenticated Store Control Center (KPIs, Orders, Refunds, Products, Coupons)
│   │   ├── about/            # Author background, campaign spend history, and publishing manifesto
│   │   ├── refund-policy/    # Digital goods delivery and refund terms
│   │   ├── license/          # Single-operator license agreement
│   │   ├── privacy/          # Privacy & data protection policy
│   │   ├── terms/            # Commercial terms of service
│   │   ├── contact/          # Support desk with working submission form
│   │   ├── sitemap.ts        # Dynamic XML sitemap generator
│   │   ├── robots.ts         # Robots.txt crawling directives
│   │   └── api/
│   │       ├── orders/       # Server-side order creation & price validation
│   │       ├── payments/     # HMAC-SHA256 signature verification & entitlement issuance
│   │       ├── webhooks/     # Idempotent Razorpay webhook listener
│   │       ├── download/     # Cryptographic streaming file download handler
│   │       ├── coupons/      # Authoritative coupon calculation
│   │       ├── purchases/    # Purchase recovery OTP generation & validation
│   │       ├── contact/      # Contact inquiry handler
│   │       └── admin/        # Admin APIs (stats, orders refund/revoke, products, coupons)
│   ├── components/
│   │   ├── Header.tsx        # Responsive sticky masthead with search & purchases
│   │   ├── Footer.tsx        # Comprehensive footer with legal links & sitemap
│   │   ├── ProductCover.tsx  # Typographic dossier book cover component
│   │   ├── ProductCard.tsx   # Editorial product card with preview & buy triggers
│   │   ├── ProductPreviewModal.tsx # Watermarked multi-page document sample reader
│   │   ├── CheckoutModal.tsx # Frictionless 1-step checkout with coupon input & simulator
│   │   ├── BundleCard.tsx    # High-impact bundle showcase card
│   │   ├── FilterSortBar.tsx # Category tabs, difficulty levels, and sorting toolbar
│   │   └── SearchModal.tsx   # Real-time search modal
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── razorpay.ts       # Razorpay order generation & HMAC signature verification
│   │   ├── downloads.ts      # Token generation, SHA-256 hashing & entitlement validation
│   │   ├── storage.ts        # Path traversal protected file reader
│   │   ├── email.ts          # HTML transactional email renderer & dispatch
│   │   ├── auth.ts           # Admin authorization helper
│   │   └── analytics.ts      # Privacy-safe GA4 & Meta Pixel event emission
│   └── styles/
│       └── globals.css       # Complete editorial design system & CSS tokens
├── .env.example              # Environment variables template
└── README.md                 # Documentation
```

---

## 4. Quickstart & Local Setup

### ⚡ Option A: 1-Click Automated Setup (MacBook M1 / Apple Silicon)
Run the all-in-one setup script to automatically configure Homebrew, Node.js, npm, dependencies, `.env`, SQLite database, assets, seed catalog, and admin credentials:
```bash
./setup-mac.sh
# or: npm run setup
```

---

### 🛠 Option B: Manual Setup

#### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

The default `.env` is pre-configured for instant local development:
```env
DATABASE_URL="file:./dev.db"
ADMIN_EMAIL="admin@thegrowtharchive.com"
ADMIN_PASSWORD="ReplaceWithSecurePassphrase2026!#"
RAZORPAY_KEY_ID="rzp_test_growtharchive"
RAZORPAY_KEY_SECRET="growth_secret_key_mock"
RAZORPAY_WEBHOOK_SECRET="webhook_secret_hash_verify"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_growtharchive"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
STORAGE_DIR="./storage/products"
RESEND_API_KEY=""
```

### Step 3: Initialize Database & Seed Catalog
```bash
# Push database schema to SQLite
npx prisma db push

# Generate sample binary assets in storage/products/
npx tsx scripts/generate-assets.ts

# Seed all 10 products, 2 bundles, coupons, and sample order
npx prisma db seed

# Provision the default administrator account (or use scripts/create-admin.ts)
npx tsx scripts/create-admin.ts
```

### Step 4: Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Razorpay Integration & Local Test Simulator

The platform implements **Razorpay Standard Checkout** with complete server-side security:

1. **Order Creation (`POST /api/orders`)**:
   - The browser sends `{ productId, customerEmail, customerName, couponCode }`.
   - The server validates the product in the database and retrieves the authoritative price in integer paise.
   - If a coupon is provided, the server checks `isActive`, expiration, and minimum order requirements, and atomically reserves a slot.
   - The server creates a pending order in the database and requests a `razorpay_order_id` via the Razorpay API outside database transactions.
   - On definitive 4xx gateway failure, the order is marked `FAILED` and coupon reservation is immediately released.
   - On timeout or 5xx, the order remains `PENDING` with reservation preserved for webhook or reaper reconciliation.

2. **Payment Verification (`POST /api/payments/verify`)**:
   - Upon payment completion, Razorpay returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.
   - The backend verifies the HMAC SHA-256 signature using `timingSafeEqual`.
   - If valid, the order is atomically transitioned to `PAID`, the coupon reservation is converted to `usedCount`, entitlements (including bundle children) are fulfilled, and a transactional receipt is enqueued.
   - A secure HttpOnly customer session cookie (`ga_customer_session`) is established. Zero raw download tokens are exposed.

3. **Zero-Friction Local Simulator Mode**:
   - When running locally without live Razorpay API keys, the built-in simulator dialog automatically appears.
   - You can test both **"Simulate Successful Payment"** and **"Simulate Failed / Cancelled Payment"** to verify the full checkout-to-download pipeline without needing a live Razorpay merchant account.
   - Once real keys (`rzp_live_...` or `rzp_test_...`) are placed in `.env`, the store automatically switches to the live Razorpay modal.

---

## 6. Secure Digital Downloads Architecture

Files are never exposed through public static URL routes:

1. **Private Storage**:
   - Files reside in `storage/products/` on the server or Cloudflare R2 / AWS S3.
   - `LocalStorageProvider` verifies that every requested path is normalized and strictly located inside the storage sandbox, blocking directory traversal attacks (`../`).

2. **Ephemeral Download Grants**:
   - Authenticated customers request a download via `POST /api/entitlements/[id]/grant`.
   - The server generates a 256-bit random token, saves its SHA-256 hash in `DownloadGrant` with a 15-minute TTL, and returns the single-use token once.

3. **Stream-Level Delivery Boundary (`GET /api/download/[token]/[productId]`)**:
   - Validates the token hash, active order status, and quota limit.
   - Opens the physical binary stream first.
   - **Safe-Harbor Invariant**: If the storage stream fails to open, the grant is NOT consumed and customer quota is NOT deducted.
   - Atomically consumes the grant, docks quota, and logs a `DownloadEvent` once delivery begins.
   - Streams the binary file with `Content-Disposition: attachment; filename="[slug].pdf"`, `Cache-Control: private, no-store, max-age=0`, and `Referrer-Policy: no-referrer`.

---

## 7. Purchase Recovery Flow (`/purchases`)

Customers can easily access and re-download their purchased products at any time:

1. Customer navigates to `/purchases` and enters their email.
2. The server dispatches a 15-minute single-use OTP and magic link without exposing account enumeration.
3. Upon entering the 6-digit code or clicking the magic link, an authenticated customer session (`ga_customer_session`) is created.
4. The customer accesses their digital library, reviews remaining download quotas, and requests fresh download grants.

---

## 8. Admin Control Center (`/admin`)

Access the admin dashboard at `/admin`:
- **Authentication**: Identity-based login via email and scrypt-verified password.
- **Security**: 24-hour `AdminSession` absolute TTL, session rotation, logout revocation, 5 attempts / 15 min IP rate limiting, and double-submit CSRF cookie & header (`x-ga-csrf-token`) protection.
- **Features**:
  - **Overview KPIs**: Total verified revenue, paid order count, registered customer count, download events, active coupons, and top-selling products by revenue.
  - **Orders Table**: Search by order number, customer email, or payment ID. Filter by status (`ALL`, `PAID`, `PENDING`, `REFUNDED`, `PARTIALLY_REFUNDED`, `FAILED`).
  - **Refund Management**: Full refund executes Razorpay gateway refund, marks order as `REFUNDED`, and revokes entitlements and grants. Partial refund refunds specified amount without revoking entitlements.
  - **Entitlements Management**: View customer asset access and manually revoke access with audit logging.
  - **Coupons Management**: View active promotional codes, capacity/usage limits (`usedCount` and `reservedCount`), toggle active state, and create new flat (₹) or percentage (%) discount codes.
  - **Audit Trail**: Every privileged administrative action produces an immutable `AuditLog` entry.

---

## 9. SEO & Metadata

- **Dynamic Sitemap**: Automatically generated at `/sitemap.xml` indexing all published products and editorial pages.
- **Robots Directives**: `/robots.txt` allowing public indexing while disallowing `/admin` and `/api/*`.
- **Structured Data**: Schema.org `Product` and `Offer` JSON-LD embedded on every product page.
- **OpenGraph & Twitter Cards**: Full social card tags configured for Facebook, LinkedIn, and X/Twitter.

---

## 10. Production Deployment Guide

1. Deploy the Next.js repository to Vercel, Railway, AWS, or any Node.js hosting platform.
2. Configure production environment variables:
   - `DATABASE_URL`: PostgreSQL connection string (e.g. Supabase, Neon, RDS). Update `provider = "postgresql"` in `prisma/schema.prisma` for hosted Postgres.
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Live credentials from [Razorpay Dashboard](https://dashboard.razorpay.com).
   - `RAZORPAY_WEBHOOK_SECRET`: Webhook secret configured under Razorpay Settings -> Webhooks pointing to `https://yourdomain.com/api/webhooks/razorpay`.
   - `RESEND_API_KEY`: API key from [Resend](https://resend.com) for transactional emails.
   - `NEXT_PUBLIC_SITE_URL`: Production canonical domain (e.g. `https://thegrowtharchive.com`).
3. Run migrations on production database:
   ```bash
   npx prisma migrate deploy
   ```
4. Create production administrator:
   ```bash
   npx tsx scripts/create-admin.ts
   ```
