import { z } from "zod";
import type { SetItem } from "./types";

// What's inside a gift set. Stored as a JSON column, so this schema is the only
// thing standing between the database and the page: the admin API validates
// with it on the way in, and the storefront re-parses with it on the way out.
export const setItemSchema = z.object({
  name: z.string().trim().min(1),
  size: z.string().trim().min(1),
  productSlug: z.string().trim().min(1).optional(),
});

export const setItemsSchema = z.array(setItemSchema);

/** Reads the stored JSON, dropping anything malformed rather than failing the page. */
export function parseSetItems(value: unknown): SetItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const parsed = setItemSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}
