
# Harshita Collection — Build Plan

Premium boutique e-commerce. Design: **Refined Editorial** direction (soft blush/beige/ivory/gold/espresso, Cormorant Garamond + Inter, generous whitespace, mobile-first).

Because this is a large scope, I'll deliver in 4 phases so you can preview, give feedback, and we don't have a 2-hour silent build. Each phase ends in a usable site.

---

## Phase 1 — Storefront foundation + Cloud + Database

**Setup**
- Enable Lovable Cloud (database, auth, storage, server functions)
- Install design tokens in `src/styles.css` from the chosen direction (blush/beige/ivory/gold/espresso, Cormorant + Inter via root head)
- Generate hero + category hero images

**Database schema (migrations)**
- `categories` (slug, name, hero_image, sort_order)
- `products` (id, slug, name, description, fabric, category_id, price, mrp, discount_pct, rating, rating_count, stock, is_new, is_bestseller, is_featured)
- `product_images` (product_id, url, sort_order)
- `product_variants` (product_id, size, color, stock)
- All public-read via server functions using `supabaseAdmin`; RLS enabled, no anon grants
- Seed with ~20 demo products across all 9 categories

**Routes (TanStack file-based)**
- `/` — homepage (hero, categories, featured, new arrivals, bestsellers, testimonials, Instagram grid, footer)
- `/category/$slug` — product listing (filters: price, size, color; sort)
- `/product/$slug` — PDP (image gallery, size/color picker, qty, Add to Cart, Buy Now, fabric, reviews placeholder)
- `/search` — search results
- Shared `Header` (logo + search + cart/wishlist/account), `Footer`, floating WhatsApp button

**State**
- Cart + Wishlist in Zustand with `localStorage` persistence (works pre-auth; migrates to DB after login in Phase 2)
- `/cart` page with quantity update, remove, price breakdown, free-shipping message

**Deliverable**: Browseable boutique with seeded products, working cart/wishlist locally.

---

## Phase 2 — Authentication

- Email + password signup/login via Supabase Auth
- Google sign-in via Lovable broker
- Forgot password → email reset link → `/reset-password`
- "OTP via email" implemented as 6-digit code through Lovable Emails (email infra auto-setup); OTP via SMS would need a Twilio key — flagging as out-of-scope for v1 unless you provide one
- `_authenticated/` layout for `/account`, `/orders`, `/wishlist` (DB-backed once signed in)
- `profiles` table (name, phone, default address) + `addresses` table
- Header shows account state

**Deliverable**: Full auth flow, persistent user data.

---

## Phase 3 — Checkout, Orders, Admin

**Checkout** (`/checkout`)
- Address form (name, mobile, email, address, city, state, PIN)
- Order summary, coupon code field
- `coupons` table + validation server fn
- Creates `orders` + `order_items` rows on submission

**Order management**
- `/orders` (customer) and `/orders/$id` with status tracking
- Order confirmation email to customer + notification to boutique owner via Lovable Emails

**Admin** (`/admin`, role-gated)
- `user_roles` table + `has_role` security-definer (per platform pattern)
- Product CRUD with image upload to Supabase Storage (`product-images` bucket, public)
- Inventory + price management
- Orders view with status updates
- Reviews moderation
- Basic sales analytics (revenue, orders, top products)

**Deliverable**: End-to-end commerce minus real payment.

---

## Phase 4 — Razorpay payments

- I'll prompt for `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` via secure secrets form (you create them at razorpay.com → Settings → API Keys)
- Server fn `createRazorpayOrder` → returns `order_id`
- Client opens Razorpay Checkout (UPI / GPay / PhonePe / Paytm / Cards / NetBanking enabled)
- Public server route `/api/public/razorpay/webhook` verifies signature, marks order paid, fires confirmation emails
- Order status flows: `created → paid → shipped → delivered`

**Deliverable**: Live payment-ready store.

---

## Technical notes

- Stack: TanStack Start, React 19, Tailwind v4, shadcn/ui, Zustand, TanStack Query, Lovable Cloud (Supabase)
- All Supabase access via `createServerFn`; public reads go through `supabaseAdmin` with explicit column projection
- Mobile-first; tested at 375/768/1280
- SEO: per-route `head()` with title/description/og tags; product pages use product image as og:image
- Free shipping banner sitewide; WhatsApp FAB with your number (I'll prompt)
- Instagram gallery uses static images for v1 (live IG feed requires Graph API — can add in a later iteration if needed)

---

## What I need from you (later, not now)

- WhatsApp number for FAB
- Boutique owner email for order notifications
- Razorpay API keys (Phase 4)
- Optional: real product photos to replace AI-generated ones

Ready to start with **Phase 1** when you approve.
