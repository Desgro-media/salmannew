# Salman Perfumes — Architecture & Reference

A complete map of how this app works: navigation, data flow, and logic, front to back. Written to make bugs findable — when something breaks, jump to the [Troubleshooting Cheat Sheet](#troubleshooting-cheat-sheet) first, then follow the file paths.

All paths below are relative to `web/` (this file's own directory) unless stated otherwise.

---

## 1. What this is

A production storefront for **Salman Perfumes** — 6 eaux de parfum sold as `me. <Name>` (Imperial, Orchid, Akhdar, Oud Lavender, Lather, Latheer) — plus a superadmin panel for managing products, prices, photos, and viewing purchase history. It's a single Next.js app: the storefront (frontend) and the admin/API layer (backend) live in one codebase and one deployment.

**Checkout is demo-only**: orders *do* get written to Postgres (see [§9.2](#92-order-flow--checkout-to-db)), but there is no payment gateway — it's a cash-on-delivery-style flow with no real payment capture and no confirmation email.

---

## 2. Repo layout

```
SPRAY/                          ← git root
├── web/                        ← the actual app (everything below is here)
├── logo/                       ← source logo PDF (not used at runtime)
├── perfume_assets/             ← raw product photography (staging, not served)
├── reels/                      ← raw Instagram reel .mp4 source files
├── scripts/                    ← one-off Python scripts (extract_logo.py, process_products.py)
│                                  used to process the above into web/public/
└── references/lenis/           ← vendored copy of the Lenis smooth-scroll library source,
                                   for reference only — the app depends on the published
                                   `lenis` npm package, not this folder
```

Everything that actually runs is inside `web/`. The four top-level folders alongside it are asset-prep staging, not part of the build.

### Inside `web/`

```
web/
├── prisma/
│   ├── schema.prisma            Data model (§6)
│   ├── seed.ts                  Seeds superadmin + products (§9.7)
│   ├── seed-data.ts             The 6 products' starting data
│   └── migrations/              One migration: 20260805094455_init
├── src/
│   ├── app/                     Next.js App Router — pages + API routes (§5)
│   ├── components/              React components, grouped by feature
│   ├── lib/                     Data access, business logic, state stores
│   └── proxy.ts                 Route-protection middleware (§7) — Next 16 renamed
│                                 `middleware.ts` → `proxy.ts`; there is no middleware.ts
├── public/                      Static assets: /logo, /products/<slug>/*.jpg, /reels, /hero
├── docker-compose.yml           Local Postgres (port 5442)
├── prisma.config.ts             Prisma CLI config + env loading (§6)
└── next.config.ts               Turbopack root, remote image patterns (Vercel Blob)
```

---

## 3. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) | ⚠️ Next 16 has breaking changes vs. older Next you may know — see `AGENTS.md` in this folder. Biggest one: `middleware.ts` → `proxy.ts`. |
| Language | TypeScript | strict-ish, `tsc --noEmit` should stay clean |
| UI | React 19 | |
| Styling | Tailwind CSS v4 | tokens in `src/app/globals.css` (`@theme inline` block), not a `tailwind.config.js` |
| Animation | Framer Motion | reveal-on-scroll, page transitions, hero micro-interactions |
| Smooth scroll | Lenis (`lenis/react`) | wraps the whole app in `src/components/motion/SmoothScroll.tsx` |
| Client state | Zustand + `persist` middleware | cart & wishlist, persisted to `localStorage` |
| Database | PostgreSQL 16 | local via Docker Compose, port **5442** |
| ORM | Prisma 7 | uses the `@prisma/adapter-pg` driver adapter (not Prisma's built-in connector — see §6) |
| Auth | Custom — `bcryptjs` + `jose` (JWT) | no NextAuth/Clerk/etc., hand-rolled session cookie |
| Validation | Zod v4 | request body validation in `lib/order-schema.ts`, `lib/admin-schema.ts`, admin login |
| File storage | Vercel Blob (`@vercel/blob`) | product photo uploads, falls back to local disk in dev (§9.6) |
| Deployment target | Vercel | `postinstall: prisma generate` exists specifically to fix Vercel builds |

---

## 4. Running locally

```bash
cd web
npm install                 # also runs `prisma generate` via postinstall
npm run dev                 # http://localhost:3000
```

**Requires Postgres.** `DATABASE_URL` in `.env` points at `postgresql://salman:salman@localhost:5442/salman_perfumes`. Bring it up with:

```bash
docker compose up -d        # from web/, starts postgres:16-alpine on host port 5442
```

The **homepage doesn't need the DB to boot** the dev server itself, but almost every page (`/`, `/shop`, `/product/[slug]`, `/wishlist`, all of `/admin`) queries Prisma during render and will error without a live DB connection.

Required env vars (see `.env.example`):

| Var | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | `lib/db.ts`, `prisma.config.ts` | Postgres connection string |
| `SESSION_SECRET` | `lib/auth.ts` | JWT signing key for admin sessions — **throws at runtime if unset** when an admin route is hit |
| `SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD` | `prisma/seed.ts` | only used by `npx prisma db seed` |
| `BLOB_READ_WRITE_TOKEN` | `app/api/admin/uploads/route.ts` | optional locally (falls back to writing `public/uploads/`); required-in-practice on Vercel |

Seed the DB (superadmin account + 6 products):

```bash
npx prisma db seed
```

---

## 5. Full navigation map

### 5.1 Storefront (public)

All under `src/app/(site)/` (route group — doesn't appear in the URL), sharing `(site)/layout.tsx` (Header + page + Footer + CartDrawer). Storefront pages use **ISR**, `revalidate = 60`, because products are DB-driven and can't be statically enumerated at build time.

| Route | File | Purpose |
|---|---|---|
| `/` | `app/(site)/page.tsx` | Homepage: Hero → Marquee → BestSellers → SignatureCollections → FeatureSpotlight → InstagramReels → NewsletterBand |
| `/shop` | `app/(site)/shop/page.tsx` | All products, client-side filterable (`ShopGrid`) |
| `/product/[slug]` | `app/(site)/product/[slug]/page.tsx` | Product detail: gallery, size/price selector, notes, story, related products |
| `/about` | `app/(site)/about/page.tsx` | Brand story, static content + product count |
| `/checkout` | `app/(site)/checkout/page.tsx` | `CheckoutForm` — shipping details + order summary |
| `/checkout/success` | `app/(site)/checkout/success/page.tsx` | Confirmation screen, reads `?order=&eta=` from the query string |
| *(404)* | `app/(site)/not-found.tsx` | "This page evaporated." |

Outside the `(site)` group, still storefront-styled:

| Route | File | Purpose |
|---|---|---|
| `/wishlist` | `app/wishlist/page.tsx` | Saved products (reads the Zustand wishlist store client-side) |

### 5.2 Admin (protected)

All under `src/app/admin/`. Everything except `/admin/login` requires a valid session cookie (enforced by `proxy.ts`, §7).

| Route | File | Purpose |
|---|---|---|
| `/admin/login` | `app/admin/login/page.tsx` | Email/password form → `POST /api/admin/login` |
| `/admin` | `app/admin/(dashboard)/page.tsx` | Product list + aggregate stats (Products / Total Buyers / Units Sold) |
| `/admin/products/new` | `app/admin/(dashboard)/products/new/page.tsx` | `ProductForm` in create mode |
| `/admin/products/[id]/edit` | `app/admin/(dashboard)/products/[id]/edit/page.tsx` | `ProductForm` in edit mode |
| `/admin/products/[id]/purchasers` | `app/admin/(dashboard)/products/[id]/purchasers/page.tsx` | Paginated list of every order line for one product |

### 5.3 API routes

| Route | Methods | Auth | Purpose |
|---|---|---|---|
| `/api/orders` | `POST` | public | Places an order — the checkout backend seam (§9.2) |
| `/api/admin/login` | `POST` | public | Verifies credentials, issues session cookie |
| `/api/admin/logout` | `POST` | session | Clears session cookie |
| `/api/admin/products` | `GET`, `POST` | session | List products (with stats) / create a product |
| `/api/admin/products/[id]` | `PATCH`, `DELETE` | session | Update a product (incl. sizes), or archive/delete it |
| `/api/admin/products/[id]/purchases` | `GET` | session | Paginated purchase history for one product (JSON twin of the purchasers page) |
| `/api/admin/uploads` | `POST` | session | Uploads a product photo (Vercel Blob or local disk) |

### 5.4 Header/footer link map (what a user can actually click)

- **Header** (`components/layout/Header.tsx`): logo → `/`, nav → `/shop`, `/about`; icons → `/wishlist` (with saved-count badge) and a cart-drawer toggle (not a route — opens `CartDrawer`, with item-count badge).
- **Footer** (`components/layout/Footer.tsx`): first 5 products → `/product/[slug]`, "View all" → `/shop`, Company → `/about`, `/shop`, `/checkout`.
- **CartDrawer**: "Checkout" → `/checkout`. Empty state: "Browse the Collection" → `/shop`.

---

## 6. Data model (`prisma/schema.prisma`)

Postgres via Prisma 7. One migration on disk: `prisma/migrations/20260805094455_init/`.

```
Admin                        Product                          ProductSize
├─ id (cuid)                 ├─ id (cuid)                      ├─ id (string, NOT auto — see below)
├─ email (unique)             ├─ slug (unique)                  ├─ productId ──► Product (CASCADE)
├─ passwordHash (bcrypt)      ├─ name, fullName, tagline        ├─ label, volumeMl
├─ role: ADMIN | SUPERADMIN   ├─ category: enum                 ├─ sku (unique)
└─ createdAt                  ├─ description, story             ├─ price, compareAtPrice (Int, whole ₹)
                               ├─ notesTop/Heart/Base (String[]) ├─ image, thumb
                               ├─ concentration, accent          └─ orderItems[]
                               ├─ images (String[])
                               ├─ bestseller, isNew, isArchived  Order
                               ├─ sizes[], orderItems[]          ├─ id (cuid), orderNumber (unique, "SP-<base36 ts>")
                               └─ createdAt, updatedAt            ├─ status (free string, default "received")
                                                                   ├─ subtotal, shipping, total (Int, whole ₹)
                                                                   ├─ customer* fields (denormalized, no Customer model)
                                                                   ├─ estimatedDelivery (DateTime, = now + 5 days)
                                                                   └─ items[]

                                                                  OrderItem  (snapshot at purchase time)
                                                                  ├─ id (cuid)
                                                                  ├─ orderId ──► Order (CASCADE)
                                                                  ├─ productId ──► Product (RESTRICT)
                                                                  ├─ sizeId ──► ProductSize (RESTRICT)
                                                                  └─ name, sizeLabel, price, image, sku, quantity
                                                                     (copied at order time — a later product edit
                                                                      or price change never rewrites old orders)
```

**Things worth knowing:**

- **Money is whole rupees**, always `Int`. `formatPrice()` (`lib/format.ts`) never renders decimals — there's no paise anywhere in the app.
- **`ProductSize.id` is not auto-generated.** Admin routes default it to `sku.toLowerCase()` when creating a size (`app/api/admin/products/route.ts`); the seed file hand-authors ids like `"imperial-30"`. Don't assume cuid-shaped ids on sizes.
- **`onDelete: Restrict` on `OrderItem.productId`/`sizeId`** means you physically cannot delete a `Product` or `ProductSize` that has order history — the DB rejects it. This is why the admin delete/edit routes have soft-delete and 409-on-conflict logic (§9.3).
- **`images[i]` corresponds to `sizes[i]` by index** — this is a data convention (not DB-enforced) that both `seed-data.ts` and the admin-created products follow: each size's dedicated photo is duplicated into the product's top-level `images` array at the same position. The product gallery/size-sync feature (§8.3) depends on this holding true.
- **No inventory/stock field exists anywhere.** Orders can be placed for any quantity regardless of "real" stock — there is no concept of stock in this schema.
- **No `Customer` model.** "Unique buyers" (`lib/purchase-stats.ts`) is computed as distinct `Order.customerEmail` strings — two orders with slightly different typed emails count as two buyers.

### Prisma connection (`lib/db.ts` + `prisma.config.ts`)

The schema's `datasource` block has **no `url = env(...)`** — on purpose (comment in `prisma.config.ts`), so that `prisma generate` (run on every `npm install`, including CI/Vercel builds) never throws just because `DATABASE_URL` isn't set at build time. Instead:

- `prisma.config.ts` loads `.env.local`/`.env` and points Prisma's CLI (`migrate`, `db seed`, `studio`) at `process.env.DATABASE_URL` directly.
- `lib/db.ts` constructs the actual runtime client with the **`@prisma/adapter-pg` driver adapter**: a `pg.Pool` wrapped in `PrismaPg`, passed to `new PrismaClient({ adapter })`. It's cached on `globalThis.prisma` outside production to survive dev hot-reloads without exhausting Postgres connections.

---

## 7. Auth & sessions

Hand-rolled, no third-party auth library. `src/lib/auth.ts`:

- **Passwords**: `bcryptjs`, cost factor `12` (`hashPassword`/`verifyPassword`).
- **Session token**: JWT via `jose`, `HS256`, signed with `SESSION_SECRET`. Claims: `sub` = `Admin.id`, `email`, `role` (`"ADMIN" | "SUPERADMIN"`), 7-day expiry.
- **Cookie**: name `sp_admin_session`, `httpOnly`, `secure` in production, `sameSite: "lax"`, 7-day `maxAge`.
- **`verifySessionToken`** never throws — invalid/expired/malformed tokens just resolve to `null`.

### Route protection — `src/proxy.ts`

Next.js 16 renamed `middleware.ts` to `proxy.ts` (same mechanism, new filename/export name). This is the **only** access-control layer:

```ts
const PUBLIC_PATHS = new Set(["/admin/login", "/api/admin/login"]);
matcher: ["/admin/:path*", "/api/admin/:path*"]
```

Any `/admin/*` or `/api/admin/*` request not in `PUBLIC_PATHS` must present a valid `sp_admin_session` cookie, or: API paths get `401`, page paths get redirected to `/admin/login`.

### Login flow

1. `app/admin/login/page.tsx` (client) → `POST /api/admin/login` with `{ email, password }`.
2. Route validates with Zod, looks up `Admin` by email, verifies password.
3. On success: `createSessionToken(...)`, set as the `sp_admin_session` cookie, respond `200 { email, role }`.
4. **If `SESSION_SECRET` is missing**, token signing throws — this is caught and returned as a `500` ("Server misconfiguration") rather than a `401`. This was a deliberate fix (see commit `f2c59ee`): previously a missing env var surfaced to the admin as a misleading "Invalid credentials" instead of a config error.
5. Logout: `LogoutButton` → `POST /api/admin/logout` → deletes the cookie → redirect to `/admin/login`.

---

## 8. Frontend architecture

### 8.1 Layout tree

```
app/layout.tsx (root)              — <html>/<body>, Archivo font, wraps everything in <SmoothScroll> (Lenis)
└─ app/(site)/layout.tsx           — Header + <main> + Footer + CartDrawer  (storefront only)
   └─ page-level content
└─ app/admin/(dashboard)/layout.tsx — admin top bar + nav + LogoutButton    (admin only, separate shell)
```

Cart and wishlist are **global overlays**, not route-scoped: `CartDrawer` and the wishlist badge live in the `(site)` layout, so they're consistent across every storefront page.

### 8.2 Homepage sections (`components/home/*`, in render order)

1. **`Hero.tsx`** — kinetic "SALMAN" wordmark (letter-by-letter spring entrance), 4 floating perfume bottle cutouts with independent drift animations + mouse parallax, scroll-linked scale/opacity/fade via `useScroll`.
2. **`Marquee.tsx`** — CSS-animated infinite scroll strip of taglines (`animate-marquee`, defined in `globals.css`).
3. **`BestSellers.tsx`** — horizontally scrollable row of `bestseller: true` products, "From ₹X" pricing (cheapest size).
4. **`SignatureCollections.tsx`** — horizontally scrollable row of *all* products, with a Sale badge when any size has `compareAtPrice`.
5. **`FeatureSpotlight.tsx`** → **`FeatureSpotlightCarousel.tsx`** — auto-rotates every 5s (`setTimeout` loop) through all products, full-bleed dark section with notes pyramid preview and manual dot navigation.
6. **`InstagramReels.tsx`** → **`ReelCard.tsx`** — 3 hardcoded `.mp4` reels (`public/reels/`), autoplay/pause via `IntersectionObserver` on scroll visibility, tap-to-mute.
7. **`NewsletterBand.tsx`** — email capture form; **client-only, does not call any API** — `handleSubmit` just flips local `submitted` state. No email is actually collected anywhere server-side.

Both `BestSellers` and `SignatureCollections` render `product.images[0]` directly rather than using `ProductCard` — they're bespoke horizontal-scroll cards, not the same component as the shop grid.

### 8.3 Product catalog & detail page

- **`ShopGrid.tsx`** (`/shop`): client-side category filter (`Signature Collection` / `Best Sellers` / category enum values), animated with Framer Motion `layout`/`AnimatePresence`. Renders `ProductCard` for each match.
- **`ProductCard.tsx`**: used on `/shop`, `/wishlist`, and "You Might Also Like" on the product page. Shows `product.images[0]` and **the price of `product.sizes[0]`** (not a min–max range — this was a deliberate fix so the displayed price always matches the displayed image/size, since the card only ever shows one image).
- **Product detail page** (`/product/[slug]`) wires `ProductGallery` (image thumbnails + main image) and `AddToCartPanel` (price + size buttons + qty + add-to-cart) together via a shared **`lib/product-selection-context.tsx`** (`ProductSelectionProvider`, a plain React Context holding `activeIndex`):
  - Clicking a gallery thumbnail calls `setActiveIndex(i)` → `AddToCartPanel` re-derives `size = product.sizes[activeIndex]`, updating price/compareAtPrice/SKU.
  - Clicking a size button in `AddToCartPanel` calls `setActiveIndex(i)` → `ProductGallery` swaps its main image to `images[activeIndex]`.
  - **This only works because of the `images[i] ↔ sizes[i]` index convention** noted in §6. If that convention is ever violated (e.g. an admin uploads gallery images in a different order than sizes), the gallery image and the selected size/price will visibly desync — this is the first thing to check if "wrong photo shows for the selected size" gets reported.
  - The Provider wraps both components in `app/(site)/product/[slug]/page.tsx`; it's a client component boundary wrapping server-rendered children (standard RSC pattern — the surrounding description/notes/story stay server-rendered).
- **`NotesPyramid.tsx`** — static Top/Heart/Base note display, tinted by `product.accent`.

### 8.4 Cart & wishlist (client state)

Both are Zustand stores with the `persist` middleware (→ `localStorage`), defined in `lib/store/`:

- **`cart.ts`** (`useCart`): `items: CartLine[]`, `isOpen` (drawer visibility), `addItem` (merges by `sizeId` — adding the same size twice increments quantity instead of duplicating the line), `removeItem`, `setQuantity` (auto-removes at `quantity <= 0`), `clear`. Persisted under localStorage key `salman-perfumes-cart`. Helpers `cartSubtotal()`/`cartCount()` are plain functions, not store state (call them with `items` from the store).
- **`wishlist.ts`** (`useWishlist`): just `slugs: string[]` + `toggle(slug)`. Persisted under `salman-perfumes-wishlist`.
- **Hydration gotcha**: every component reading these stores also calls **`useHasMounted()`** (`lib/use-has-mounted.ts`, a `useSyncExternalStore` shim) and gates on `mounted` before trusting persisted values. This avoids SSR/client hydration mismatches (server always renders "empty cart," client hydrates from localStorage after mount). **If cart/wishlist counts flash `0` then update, or a hydration-mismatch warning appears, this is the mechanism to look at.**

### 8.5 Checkout

`components/checkout/CheckoutForm.tsx` (client) → collects `CustomerDetails` in local state → `lib/orders.ts`'s `placeOrder()` → `POST /api/orders` (full trace in §9.2) → clears cart → redirects to `/checkout/success?order=...&eta=...`. Shipping cost shown here is a **client-side preview only**; the server recomputes it authoritatively (§9.2/9.5).

### 8.6 Design system & motion

- **Tokens**: `src/app/globals.css`, Tailwind v4 `@theme inline` block — no `tailwind.config.js`. Color tokens: `--color-ink`, `--color-paper` (+ `-2`/`-3` shades), `--color-gold` (+ `-deep`/`-ink`), `--color-line`. Font: Archivo (`next/font/google`), CSS var `--font-archivo`.
- **`.container-grid`** — the shared max-width/padding wrapper used by nearly every section (`globals.css`).
- **Motion primitives**: `components/motion/Reveal.tsx` (scroll-triggered fade+slide-up, used everywhere for section entrances) and `components/motion/SmoothScroll.tsx` (Lenis wrapper, root layout).
- **`components/ui/`**: `Button`/`ButtonLink` (3 variants: primary/secondary/ghost), `Input`/`Textarea`/`Field`, `AccordionItem`, `HorizontalScroller` (the scroll-snap row used by BestSellers/SignatureCollections/InstagramReels, with fade-edge arrow buttons that appear based on scroll position).

---

## 9. Backend architecture

### 9.1 Data access layer — `lib/products.ts`

`getAllProducts()`, `getProductBySlug()`, `getRelatedProducts()` — all query Prisma directly (`where: { isArchived: false }`), used by every storefront Server Component. **Despite comments in `lib/types.ts` and `README.md` suggesting products are still static data "mirroring a future DB schema," the DB has been the real source of truth since commit `8737e3d`** — `prisma/seed-data.ts` only seeds the initial 6 rows; everything else goes through the admin panel.

### 9.2 Order flow — checkout to DB

```
CheckoutForm.tsx (client)
   │ placeOrder({ items, customer, subtotal })
   ▼
lib/orders.ts → fetch POST /api/orders
   ▼
app/api/orders/route.ts
   │ 1. Zod-validate body (order-schema.ts: orderPayloadSchema)
   │ 2. Re-fetch ProductSize rows for every sizeId in the cart —
   │    client-sent price/subtotal are IGNORED for money math
   │ 3. Recompute subtotal from DB prices × client quantities
   │ 4. calculateShipping(subtotal) (lib/shipping.ts) — server-authoritative
   │ 5. orderNumber = "SP-" + Date.now().toString(36).toUpperCase()
   │ 6. estimatedDelivery = now + 5 days
   │ 7. prisma.order.create({ items: { create: [...] } })  — single nested
   │    write, Order + OrderItems, snapshotting name/price/image/sku
   ▼
Response: { orderId, status: "received", estimatedDelivery }
   ▼
CheckoutForm clears the cart, router.push("/checkout/success?order=...&eta=...")
```

**This is a real DB write, not a mock** — `README.md`'s "What's not wired up yet" section and a stale comment at the top of `lib/orders.ts` both still say otherwise; that's leftover from before persistence was added and should be treated as out of date. What genuinely *is* still missing: **no payment gateway** (`CheckoutForm` and the success page both say so explicitly) and **no inventory check** — quantity is never validated against any stock number, because no stock field exists.

### 9.3 Admin dashboard & product CRUD

- **`/admin`** (`app/admin/(dashboard)/page.tsx`) queries Prisma **directly** as a Server Component (not via `/api/admin/products`) — fetches all products + `getPurchaseStatsByProduct()` in parallel, shows per-product price range, buyer count, units sold, and a status badge derived from `isArchived`/`bestseller`/`isNew` (there's no explicit "active" field).
- **`ProductForm.tsx`** (`components/admin/`) is shared by both the create (`/admin/products/new`) and edit (`/admin/products/[id]/edit`) pages. Auto-fills `slug` from `name` (until manually touched), `fullName` as `` `me. ${name}` ``, and each size's SKU as `SP-<3-letter-slug>-<volume padded to 3>`. Validates that any size marked "on sale" has `compareAtPrice > price` before allowing submit.
- **`POST /api/admin/products`** — Zod-validates (`admin-schema.ts`), 409s on duplicate slug, creates with nested `sizes: { create: [...] }`.
- **`PATCH /api/admin/products/[id]`** — runs in a `$transaction`: updates scalar fields, deletes any removed sizes (`deleteMany({ id: { notIn: keepIds } })`), upserts the rest, then calls `revalidatePath` on `/shop` and the product's page (both old and new slug if it changed) to bust the 60s ISR cache immediately. **Catches Prisma error `P2003`** (foreign-key violation) specifically to return a friendly `409` ("Can't remove a size that already has orders against it.") instead of a raw DB error — this is the `OrderItem.sizeId onDelete: Restrict` constraint from §6 surfacing at the API layer.
- **`DELETE /api/admin/products/[id]`** — **soft-deletes** (`isArchived: true`) if the product has any `orderItems` (hard delete would fail on the FK anyway); otherwise hard-deletes.

### 9.4 Purchase stats — `lib/purchase-stats.ts`

`getPurchaseStatsByProduct()` and `getPurchaseStatsForProduct(id)` both aggregate over **every matching `OrderItem` in JS** (not raw SQL — comment explicitly calls this an acceptable simplification for a low-volume admin tool). Used by the admin dashboard, the purchasers page, and the two admin API routes that expose product/purchase data. "Unique buyers" = distinct `Order.customerEmail` values.

### 9.5 Shipping — `lib/shipping.ts`

```ts
SHIPPING_THRESHOLD = 2999   // ₹
SHIPPING_FEE = 149          // ₹ flat
calculateShipping(subtotal) → 0 if subtotal is 0 or ≥ threshold, else 149
```

Called from both `CheckoutForm.tsx` (display preview) and `api/orders/route.ts` (authoritative — this is the number that actually gets stored and charged).

### 9.6 Image uploads — `app/api/admin/uploads/route.ts`

Single upload endpoint used by `ProductForm` for both gallery images and per-size photos. `runtime = "nodejs"` (needs `node:fs`/`node:crypto`).

- If `BLOB_READ_WRITE_TOKEN` is set → uploads to **Vercel Blob** (`put()`, `products/` prefix, public access), returns the CDN URL.
- Otherwise → writes to local `public/uploads/<uuid>.<ext>` and returns a relative URL. **This fallback only works in local dev** — Vercel's filesystem is ephemeral, so on a real Vercel deploy `BLOB_READ_WRITE_TOKEN` must be set (it's auto-injected once a Blob store is attached to the project) or uploads will silently not persist.
- Filenames are always randomized (`crypto.randomUUID()`), original filename is discarded.

### 9.7 Seeding — `prisma/seed.ts`

Run with `npx prisma db seed` (command wired via `prisma.config.ts`, **not** a `package.json` script). Two steps, sequential:

1. **`seedSuperadmin()`** — requires `SEED_SUPERADMIN_EMAIL`/`SEED_SUPERADMIN_PASSWORD` (throws if unset), upserts an `Admin` row by email. ⚠️ **Always forces `role: SUPERADMIN`** on both the create *and* update branch — re-running the seed against an existing admin's email will silently promote them, not just reset their password.
2. **`seedProducts()`** — upserts each product in `seed-data.ts` by `slug`, and each size by `sku`. Seed-authored size ids (`"imperial-30"`, etc.) don't follow the `sku.toLowerCase()` convention the admin API uses for new sizes — both are valid, just don't assume one format.

---

## 10. Known gaps & stale docs

- **`README.md`** and the header comment in **`lib/orders.ts`** both say checkout doesn't persist. **It does now** (§9.2) — those docs predate commit `8737e3d` and should be corrected/removed.
- **No payment gateway.** Orders are real DB rows, but nothing captures money. Explicitly labeled "demo checkout" in the UI.
- **No inventory/stock modeling.** Any quantity can be ordered regardless of anything resembling stock.
- **`GET /api/admin/products`** exists and is fully implemented but nothing in the current UI calls it — the admin dashboard queries Prisma directly instead. It's either dead code or meant for a future client-side refetch/external consumer.
- **Purchasers page vs. its API twin are duplicated logic**, not shared — `app/admin/(dashboard)/products/[id]/purchasers/page.tsx` and `app/api/admin/products/[id]/purchases/route.ts` independently implement the same paginated query.
- **Newsletter signup is fully client-side fake** — `NewsletterBand.tsx` never calls an API; no email is captured anywhere.
- **The `images[i] ↔ sizes[i]` index pairing is a convention, not a DB constraint.** Nothing stops an admin from uploading gallery images in an order that doesn't match the sizes — if that happens, the gallery/size-sync feature (§8.3) will show the wrong photo for a given size.

---

## Troubleshooting cheat sheet

| Symptom | Start here |
|---|---|
| Dev server won't load any product/shop/admin page | Is Postgres up? `docker compose up -d` in `web/`, check `DATABASE_URL` in `.env` |
| "Invalid credentials" on admin login even with the right password | Check `SESSION_SECRET` is actually set — a missing secret used to masquerade as this exact error (fixed, but worth re-checking if it regresses); `lib/auth.ts`, `app/api/admin/login/route.ts` |
| Admin pages redirect to `/admin/login` unexpectedly | Cookie `sp_admin_session` expired/missing/invalid — `src/proxy.ts`, `lib/auth.ts` `verifySessionToken` |
| Product page: wrong photo shown for the selected size | `images[i] ↔ sizes[i]` index mismatch — check the product's `images` array order in the DB/admin form against its `sizes` order; logic lives in `lib/product-selection-context.tsx`, `components/product/ProductGallery.tsx`, `components/product/AddToCartPanel.tsx` |
| Shop/wishlist card shows the wrong price for its image | `components/product/ProductCard.tsx` — price always derives from `sizes[0]`, matching `images[0]` |
| Cart/wishlist count flashes 0 or mismatches localStorage | Hydration guard — check `useHasMounted()` usage in the component; stores are `lib/store/cart.ts` / `lib/store/wishlist.ts` |
| Order total looks wrong / doesn't match what was shown at checkout | Server recomputes everything from DB prices in `app/api/orders/route.ts` — client-sent price/subtotal are ignored by design; compare against live `ProductSize.price` + `lib/shipping.ts` |
| Can't delete a product/size in admin | Likely has order history — `OrderItem` FKs are `onDelete: Restrict`; check for the `409` from `PATCH`/`DELETE /api/admin/products/[id]` and the soft-delete (`isArchived`) fallback |
| Admin edit doesn't show up on the live product page for ~a minute | Expected — ISR `revalidate = 60`; edits should still be immediate via the `revalidatePath` calls in the PATCH/DELETE routes. If it's *not* immediate, check those calls in `app/api/admin/products/[id]/route.ts` |
| Product photo upload fails only on Vercel (works locally) | `BLOB_READ_WRITE_TOKEN` missing on Vercel — the local-disk fallback in `app/api/admin/uploads/route.ts` doesn't persist on Vercel's filesystem |
| Build fails on Vercel with a Prisma-related error | Check the `postinstall: "prisma generate"` script in `package.json` still exists — this was added specifically to fix that |
| `middleware.ts` edits have no effect | There is no `middleware.ts` — this project uses `src/proxy.ts` (Next.js 16 renamed the file/export) |
