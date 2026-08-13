// The single source of truth for what a product's `category` may be. The
// product type, the admin form's dropdown, the API's validation schema and the
// shop's filter chips all derive from this list — it used to be spelled out in
// each of those four places, and adding a category meant finding all four.
//
// "Privé" is the second line rather than a scent family, which is why it leads
// the list instead of sitting inside the Oriental/Floral/Fresh/Woody/Musk group.
export const PRODUCT_CATEGORIES = [
  "Prive",
  "Oriental",
  "Floral",
  "Fresh",
  "Woody",
  "Musk",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// Stored unaccented because these are also Prisma enum members, whose names
// have to be plain identifiers — and it keeps ?filter=Prive out of percent
// encoding in shop URLs. The brand sets it PRIVÉ, so the accent is put back
// here, at the point of display, and nowhere else.
const CATEGORY_LABELS: Partial<Record<ProductCategory, string>> = {
  Prive: "Privé",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category as ProductCategory] ?? category;
}

// The shop's chips are the two lines plus everything — deliberately not one
// chip per category. A scent family is how a bottle is tagged; `me.` and Privé
// are what a visitor is actually choosing between, and nine chips scrolling off
// the edge hid that. The families stay in PRODUCT_CATEGORIES, where the admin
// form and the badge on a product card still use them.
export const SHOP_FILTERS = ["All", "Me", "Prive"] as const;

export type ShopFilter = (typeof SHOP_FILTERS)[number];

const FILTER_LABELS: Record<ShopFilter, string> = {
  All: "All",
  Me: "me.",
  Prive: "Privé",
};

export function shopFilterLabel(filter: ShopFilter): string {
  return FILTER_LABELS[filter];
}

// `me.` is defined as "not Privé" rather than as a stored flag of its own: the
// two lines exhaust the catalogue, so a scent added under a new family lands in
// `me.` without anyone having to remember to update this.
export function matchesShopFilter(
  product: { category: string },
  filter: ShopFilter,
): boolean {
  if (filter === "All") return true;
  if (filter === "Prive") return product.category === "Prive";
  return product.category !== "Prive";
}

// The second axis, crossed with the line chips above. Kept as short tokens
// because these are URL values — the header and the homepage rows link straight
// into ?type=, which is what makes "Best Sellers" in the nav open the shop with
// the filter already applied.
export const SHOP_TYPES = ["All", "Signature", "BestSellers"] as const;

export type ShopType = (typeof SHOP_TYPES)[number];

const TYPE_LABELS: Record<ShopType, string> = {
  All: "All types",
  Signature: "Signature Collection",
  BestSellers: "Best Sellers",
};

export function shopTypeLabel(type: ShopType): string {
  return TYPE_LABELS[type];
}

// Both read a flag set per product in the admin. Signature started life as
// "every scent that isn't Privé" — true of the catalogue on the day it was
// written, but it made the collection something no one could edit. It is a
// column now, seeded from that same rule.
export function matchesShopType(
  product: { bestseller?: boolean; signature?: boolean },
  type: ShopType,
): boolean {
  if (type === "All") return true;
  if (type === "BestSellers") return product.bestseller === true;
  return product.signature === true;
}

export const PRICE_BANDS = ["Any", "Under500", "500to999", "1000plus"] as const;

export type PriceBand = (typeof PRICE_BANDS)[number];

const BAND_LABELS: Record<PriceBand, string> = {
  Any: "Any price",
  Under500: "Under ₹500",
  "500to999": "₹500 – ₹999",
  "1000plus": "₹1,000 & above",
};

export function priceBandLabel(band: PriceBand): string {
  return BAND_LABELS[band];
}

/** what a card shows as "From ₹…" — the cheapest size */
export function productFromPrice(product: { sizes: { price: number }[] }): number {
  return Math.min(...product.sizes.map((size) => size.price));
}

// A scent qualifies if *any* of its sizes falls in the band, not if its "from"
// price does. Asking for ₹1,000 and above and being shown nothing but the 20 ml
// decants — which is what matching on the cheapest size would do — reads as the
// filter being broken.
export function matchesPriceBand(
  product: { sizes: { price: number }[] },
  band: PriceBand,
): boolean {
  if (band === "Any") return true;
  return product.sizes.some(({ price }) => {
    if (band === "Under500") return price < 500;
    if (band === "500to999") return price >= 500 && price <= 999;
    return price >= 1000;
  });
}

export const SHOP_SORTS = ["Featured", "PriceAsc", "PriceDesc"] as const;

export type ShopSort = (typeof SHOP_SORTS)[number];

const SORT_LABELS: Record<ShopSort, string> = {
  Featured: "Featured",
  PriceAsc: "Price: low to high",
  PriceDesc: "Price: high to low",
};

export function shopSortLabel(sort: ShopSort): string {
  return SORT_LABELS[sort];
}
