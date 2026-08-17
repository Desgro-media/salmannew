// Shapes here intentionally mirror what a real database schema would look like
// (Product / ProductVariant / Order / OrderItem) so the swap from static data
// to a real backend later is a data-source change, not a type change.

import type { ProductCategory } from "./shop-filters";

export interface FragranceNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface ProductSize {
  id: string;
  label: string;
  volumeMl: number;
  sku: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  thumb: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  fullName: string;
  tagline: string;
  category: ProductCategory;
  description: string;
  story: string;
  notes: FragranceNotes;
  concentration: string;
  accent: string;
  images: string[];
  sizes: ProductSize[];
  bestseller?: boolean;
  signature?: boolean;
  isNew?: boolean;
}

export interface CartLine {
  productSlug: string;
  sizeId: string;
  name: string;
  sizeLabel: string;
  price: number;
  image: string;
  quantity: number;
  sku: string;
}

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderPayload {
  items: CartLine[];
  customer: CustomerDetails;
  subtotal: number;
}

export interface OrderConfirmation {
  orderId: string;
  estimatedDelivery: string;
}

/**
 * What the browser needs to open the Razorpay modal. `keyId` is the publishable
 * half of the key pair and is meant to be seen by the client; it is sent in the
 * response rather than inlined as a NEXT_PUBLIC_ build-time variable so that
 * rotating a key or moving between test and live is a server env change alone.
 */
export interface CheckoutSession {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  prefill: { name: string; email: string; contact: string };
}
