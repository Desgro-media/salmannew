import { prisma } from "@/lib/db";

// The product codes (SKUs), one row per size. The code is what the shop sends
// PostBridge with every order and what PostBridge must hold in its own catalogue,
// so this is the list to hand over — and to re-export whenever a product or size
// is added, so the two catalogues stay in step.
//
// The rules (what counts as retired, how a cell is escaped) live here, away from
// the page and the download, so both show exactly the same thing.

export type CodeStatus = "On sale" | "Switched off" | "Retired";

export interface ProductCodeRow {
  code: string;
  product: string;
  size: string;
  /** Grams, with the box. Null while nobody has weighed it. */
  weightGrams: number | null;
  /** Whole rupees. */
  price: number;
  status: CodeStatus;
}

interface ProductWithSizes {
  name: string;
  isActive: boolean;
  isArchived: boolean;
  sizes: {
    sku: string;
    label: string;
    volumeMl: number;
    price: number;
    weightGrams: number | null;
    isArchived: boolean;
  }[];
}

/**
 * Retired = the product or that size was archived. Its code is still reserved
 * (it can never be reused) but it is not for sale, so PostBridge does not need it.
 * Switched off is a product that is hidden for now and may come back.
 */
function statusOf(product: ProductWithSizes, size: ProductWithSizes["sizes"][number]): CodeStatus {
  if (product.isArchived || size.isArchived) return "Retired";
  return product.isActive ? "On sale" : "Switched off";
}

export function codeRows(products: ProductWithSizes[], options: { includeRetired: boolean }): ProductCodeRow[] {
  const rows: ProductCodeRow[] = [];

  const byName = [...products].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  for (const product of byName) {
    const sizes = [...product.sizes].sort((a, b) => a.volumeMl - b.volumeMl || a.label.localeCompare(b.label));
    for (const size of sizes) {
      const status = statusOf(product, size);
      if (status === "Retired" && !options.includeRetired) continue;
      rows.push({
        code: size.sku,
        product: product.name,
        size: size.label,
        weightGrams: size.weightGrams,
        price: size.price,
        status,
      });
    }
  }
  return rows;
}

export async function loadProductCodeRows(options: { includeRetired: boolean }): Promise<ProductCodeRow[]> {
  const products = await prisma.product.findMany({ include: { sizes: true } });
  return codeRows(products, options);
}

export const CODE_COLUMNS = ["Code", "Product", "Size", "Weight (g)", "Price (INR)", "Status"] as const;

function cells(row: ProductCodeRow): (string | number | null)[] {
  return [row.code, row.product, row.size, row.weightGrams, row.price, row.status];
}

/**
 * A spreadsheet runs a cell that begins with = + - or @ as a formula, and a
 * product name is typed by a person. A leading apostrophe keeps it as text.
 */
function asText(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number | null): string {
  if (value === null) return "";
  const text = typeof value === "number" ? String(value) : asText(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** A BOM first, so Excel reads accents (Privé) as UTF-8 instead of garbling them. */
export function toCsv(rows: ProductCodeRow[]): string {
  const lines = [CODE_COLUMNS.map(csvCell).join(","), ...rows.map((row) => cells(row).map(csvCell).join(","))];
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** Tab-separated, which is what pastes into Excel or Google Sheets as columns. */
export function toTsv(rows: ProductCodeRow[]): string {
  const tsvCell = (value: string | number | null) =>
    value === null ? "" : (typeof value === "number" ? String(value) : asText(value)).replace(/[\t\r\n]+/g, " ");
  return [CODE_COLUMNS.map(tsvCell).join("\t"), ...rows.map((row) => cells(row).map(tsvCell).join("\t"))].join("\n");
}
