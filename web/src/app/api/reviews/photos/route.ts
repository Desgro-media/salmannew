import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getCustomerSession } from "@/lib/customer-session";
import {
  ALLOWED_REVIEW_PHOTO_TYPES,
  MAX_REVIEW_PHOTO_BYTES,
} from "@/lib/review-schema";

export const runtime = "nodejs";

// Unlike /api/admin/uploads, this endpoint is reachable by any signed-in
// customer and is not covered by proxy.ts, so it authenticates and validates
// everything itself.
export async function POST(request: Request) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Please sign in to add photos." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const extension = ALLOWED_REVIEW_PHOTO_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Photos must be JPEG, PNG or WebP." },
      { status: 415 },
    );
  }

  if (file.size > MAX_REVIEW_PHOTO_BYTES) {
    return NextResponse.json(
      { error: `Photos must be under ${MAX_REVIEW_PHOTO_BYTES / (1024 * 1024)} MB.` },
      { status: 413 },
    );
  }

  // Name is derived from the verified MIME type and a random id — the client's
  // filename never reaches the filesystem or the blob key.
  const filename = `${randomUUID()}.${extension}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`reviews/${filename}`, file, {
      access: "public",
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  }

  // Local dev fallback, mirroring /api/admin/uploads: write under public/ so
  // the flow works without a Blob store attached. Vercel always has the token
  // and takes the branch above.
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "reviews");
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);
  return NextResponse.json({ url: `/uploads/reviews/${filename}` });
}
