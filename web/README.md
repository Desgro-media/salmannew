# Salman Perfumes

A production-ready storefront for the `me.` collection — 6 eaux de parfum. Next.js (App Router) + TypeScript + Tailwind v4, smooth-scrolled with [Lenis](https://github.com/darkroomengineering/lenis) and animated with [Framer Motion](https://www.framer.com/motion/).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Tailwind CSS v4** — design tokens live in `src/app/globals.css`
- **Lenis** for smooth scrolling (`src/components/motion/SmoothScroll.tsx`)
- **Framer Motion** for scroll reveals, page/drawer transitions and micro-interactions
- **Zustand** (persisted to `localStorage`) for cart state — `src/lib/store/cart.ts`

## Structure

- `src/lib/types.ts` / `src/lib/products.ts` — the product catalog. Shapes intentionally mirror a real DB schema (`Product` / `ProductSize` / `Order`) so swapping static data for a real backend later is a data-source change, not a type change.
- `src/lib/orders.ts` + `src/app/api/orders/route.ts` — the checkout "backend seam." `placeOrder()` posts to a route handler that currently mocks a response. Replace the handler body with a real payment capture + database write when ready; the frontend contract doesn't need to change.
- `src/components/product`, `src/components/checkout`, `src/components/home` — feature components.
- `src/components/layout` — header, footer, mobile nav, cart drawer.

## Content

Product copy, notes and prices in `src/lib/products.ts` are placeholders — swap in real pricing, descriptions and (if desired) real fragrance notes before launch.

## What's not wired up yet

This ships as a polished frontend with a demo checkout: cart, shipping form and an order-confirmation screen all work, but `/api/orders` doesn't take payment or persist anything. Before going live you'll want:

- A real payment gateway (e.g. Razorpay, given INR pricing)
- A database for orders/inventory
- Order confirmation email
