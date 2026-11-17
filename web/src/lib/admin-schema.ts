import { z } from "zod";
import { PRODUCT_CATEGORIES } from "./shop-filters";
import { setItemsSchema } from "./set-items";

export const productSizeInputSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().trim().min(1),
    volumeMl: z.number().int().positive(),
    sku: z.string().trim().min(1),
    price: z.number().int().nonnegative(),
    compareAtPrice: z.number().int().nonnegative().optional(),
    image: z.string().trim().min(1),
    thumb: z.string().trim().min(1),
  })
  .refine((size) => size.compareAtPrice == null || size.compareAtPrice > size.price, {
    message: "Original price must be higher than the sale price.",
    path: ["compareAtPrice"],
  });

export const productInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens."),
  name: z.string().trim().min(1),
  fullName: z.string().trim().min(1),
  tagline: z.string().trim().min(1),
  category: z.enum(PRODUCT_CATEGORIES),
  description: z.string().trim().min(1),
  story: z.string().trim().min(1),
  notes: z.object({
    top: z.array(z.string().trim().min(1)),
    heart: z.array(z.string().trim().min(1)),
    base: z.array(z.string().trim().min(1)),
  }),
  concentration: z.string().trim().min(1),
  accent: z.string().trim().min(1),
  images: z.array(z.string().trim().min(1)).min(1),
  bestseller: z.boolean().optional(),
  signature: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isSet: z.boolean().optional(),
  setItems: setItemsSchema.optional(),
  sizes: z.array(productSizeInputSchema).min(1),
});

const SET_NEEDS_ITEMS = {
  message: "A set needs at least one item listed under \"What's inside\".",
  path: ["setItems"],
};

// Checked on create, and on any update that touches either field. An update
// that only flips isActive leaves both undefined and passes.
function setHasItems(data: { isSet?: boolean; setItems?: unknown[] }): boolean {
  return data.isSet !== true || (data.setItems?.length ?? 0) > 0;
}

export const productCreateSchema = productInputSchema.refine(setHasItems, SET_NEEDS_ITEMS);

export const productUpdateSchema = productInputSchema
  .partial()
  .extend({
    isArchived: z.boolean().optional(),
  })
  .refine(setHasItems, SET_NEEDS_ITEMS);
