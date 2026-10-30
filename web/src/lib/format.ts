const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number): string {
  return currencyFormatter.format(value);
}

/** "5 November" — the form the confirmation screen quotes a delivery date in. */
export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
}
