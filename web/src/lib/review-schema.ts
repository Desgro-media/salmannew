import { z } from "zod";

export const MAX_REVIEW_PHOTOS = 4;
export const MAX_REVIEW_PHOTO_BYTES = 5 * 1024 * 1024;

// Keyed by MIME type so the stored extension comes from what the file actually
// is, never from the client-supplied filename.
export const ALLOWED_REVIEW_PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// A review photo URL is rendered back out through next/image, so only accept
// the two shapes this app actually issues: the local dev fallback and the blob
// store allowed in next.config.ts. Without this, a crafted request could plant
// an arbitrary remote URL (or a data:/javascript: string) on a product page.
const reviewPhotoUrl = z
  .string()
  .refine(
    (url) =>
      /^\/uploads\/reviews\/[A-Za-z0-9._-]+$/.test(url) ||
      /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/reviews\/[A-Za-z0-9._/-]+$/.test(
        url,
      ),
    "Unrecognised photo URL.",
  );

export const reviewPayloadSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z
    .string()
    .trim()
    .min(10, "Please write at least a sentence.")
    .max(2000, "Reviews are limited to 2000 characters."),
  photos: z.array(reviewPhotoUrl).max(MAX_REVIEW_PHOTOS).default([]),
});

export type ReviewPayload = z.infer<typeof reviewPayloadSchema>;
