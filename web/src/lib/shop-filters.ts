// The single source of truth for what a product's `category` may be. The
// product type, the admin form's dropdown, the API's validation schema and the
// shop's filter chips all derive from this list — it used to be spelled out in
// each of those four places, and adding a category meant finding all four.
//
// "Privé" is the second line rather than a scent family, which is why it leads
// the list instead of sitting inside the Oriental/Floral/Fresh/Woody/Musk group.
// "Bakhoor" is not a scent family either but a different kind of product, so it
// closes the list; the admin form chooses it through its "What are you adding?"
// control and leaves it out of the scent-family dropdown (see productKind below).
export const PRODUCT_CATEGORIES = [
  "Prive",
  "Oriental",
  "Floral",
  "Fresh",
  "Woody",
  "Musk",
  "Bakhoor",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const BAKHOOR_CATEGORY = "Bakhoor" as const satisfies ProductCategory;

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

// What kind of thing a product is. A gift set is a flag of its own (it mixes
// products, so no single category fits it); bakhoor is a category value; anything
// else is a perfume, whatever scent family or line it sits in. One function, so
// the shop's tabs, the order of the grid and the admin form cannot disagree.
export type ProductKind = "set" | "perfume" | "bakhoor";

export function productKind(product: { category: string; isSet?: boolean }): ProductKind {
  if (product.isSet) return "set";
  return product.category === BAKHOOR_CATEGORY ? "bakhoor" : "perfume";
}

// The shop's tabs are the kinds of thing it sells, in the order a visitor is most
// likely to want them. They used to be the two perfume lines (me. and Privé); both
// are perfumes and now share the Perfumes tab, and the line is still visible as the
// badge on every card. The scent families stay in PRODUCT_CATEGORIES, where the
// admin form and that badge use them.
export const SHOP_FILTERS = ["All", "Sets", "Perfumes", "Bakhoor"] as const;

export type ShopFilter = (typeof SHOP_FILTERS)[number];

const FILTER_LABELS: Record<ShopFilter, string> = {
  All: "All",
  Sets: "Gift Sets",
  Perfumes: "Perfumes",
  Bakhoor: "Bakhoor",
};

export function shopFilterLabel(filter: ShopFilter): string {
  return FILTER_LABELS[filter];
}

// ?filter= arrives from a URL anyone can edit or keep, so it is matched against
// the known values rather than cast. The two values the old tabs used still
// resolve — both lines are perfumes — so a saved link or a search result lands on
// the Perfumes tab instead of quietly opening the unfiltered shop. A Map, not an
// object: "constructor" and "__proto__" must not look like a match.
const LEGACY_FILTERS = new Map<string, ShopFilter>([
  ["Me", "Perfumes"],
  ["Prive", "Perfumes"],
]);

export function parseShopFilter(value: string | undefined): ShopFilter | undefined {
  if (value === undefined) return undefined;
  return SHOP_FILTERS.find((f) => f === value) ?? LEGACY_FILTERS.get(value);
}

const FILTER_KIND: Record<Exclude<ShopFilter, "All">, ProductKind> = {
  Sets: "set",
  Perfumes: "perfume",
  Bakhoor: "bakhoor",
};

export function matchesShopFilter(
  product: { category: string; isSet?: boolean },
  filter: ShopFilter,
): boolean {
  return filter === "All" || productKind(product) === FILTER_KIND[filter];
}

// The order the kinds appear in under All: gift sets, then perfumes, then bakhoor.
// Used to group the grid; within a kind the catalogue's own order (newest first)
// is left exactly as it was.
const KIND_ORDER: Record<ProductKind, number> = { set: 0, perfume: 1, bakhoor: 2 };

export function shopGroupRank(product: { category: string; isSet?: boolean }): number {
  return KIND_ORDER[productKind(product)];
}

/** The label a product's category shows as on cards and its page. */
export function productTypeLabel(product: { category: string; isSet?: boolean }): string {
  return product.isSet ? "Gift Set" : categoryLabel(product.category);
}

// The second axis, crossed with the line chips above. Kept as short tokens
// because these are URL values — the header and the homepage rows link straight
// into ?type=, which is what makes "Best Sellers" in the nav open the shop with
// the filter already applied.
export const SHOP_TYPES = ["All", "NewArrivals", "Signature", "BestSellers"] as const;

export type ShopType = (typeof SHOP_TYPES)[number];

const TYPE_LABELS: Record<ShopType, string> = {
  All: "All types",
  NewArrivals: "New Arrivals",
  Signature: "Signature Collection",
  BestSellers: "Best Sellers",
};

export function shopTypeLabel(type: ShopType): string {
  return TYPE_LABELS[type];
}

// Best Sellers and Signature read a flag set per product in the admin.
// Signature started life as "every scent that isn't Privé" — true of the
// catalogue on the day it was written, but it made the collection something no
// one could edit. It is a column now, seeded from that same rule.
//
// New Arrivals has no flag: it is the latest few scents by when they were
// added, worked out on the server (getNewArrivals) and passed in as their ids,
// newest first. A product isn't new on its own, only relative to the rest.
export function matchesShopType(
  product: { id: string; bestseller?: boolean; signature?: boolean },
  type: ShopType,
  newArrivalIds: readonly string[],
): boolean {
  if (type === "All") return true;
  if (type === "NewArrivals") return newArrivalIds.includes(product.id);
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
