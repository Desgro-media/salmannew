import { z } from "zod";

export const customerDetailsSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  pincode: z.string().trim().min(1),
});

export const cartLineSchema = z.object({
  productSlug: z.string().min(1),
  sizeId: z.string().min(1),
  name: z.string().min(1),
  sizeLabel: z.string().min(1),
  price: z.number(),
  image: z.string().min(1),
  quantity: z.number().int().positive(),
  sku: z.string().min(1),
});

export const orderPayloadSchema = z.object({
  items: z.array(cartLineSchema).min(1),
  customer: customerDetailsSchema,
  subtotal: z.number(),
});
