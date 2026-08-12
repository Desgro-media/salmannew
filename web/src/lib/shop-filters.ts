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

// The shop's chips: every category, plus the two that are computed rather than
// stored — "Signature Collection" is everything, "Best Sellers" is a flag.
export const SHOP_FILTERS = [
  "Signature Collection",
  "Best Sellers",
  ...PRODUCT_CATEGORIES,
] as const;

export type ShopFilter = (typeof SHOP_FILTERS)[number];
