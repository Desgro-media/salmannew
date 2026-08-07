export const SHOP_FILTERS = [
  "Signature Collection",
  "Best Sellers",
  "Oriental",
  "Floral",
  "Fresh",
  "Woody",
  "Musk",
] as const;

export type ShopFilter = (typeof SHOP_FILTERS)[number];
