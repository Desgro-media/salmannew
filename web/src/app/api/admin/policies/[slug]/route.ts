import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { revalidateStorefront } from "@/lib/revalidate";
import { isPolicySlug, MAX_POLICY_BODY, MAX_POLICY_SUMMARY } from "@/lib/policies/pages";
import { unknownPlaceholders } from "@/lib/policies/placeholders";

// Authentication is handled upstream by proxy.ts, which covers /api/admin/* and
// rejects both unauthenticated requests and DELIVERY-role sessions.

const policySchema = z.object({
  body: z
    .string()
    .transform((s) => s.replace(/\r\n?/g, "\n").trim())
    .pipe(z.string().min(1).max(MAX_POLICY_BODY)),
  summary: z.string().trim().max(MAX_POLICY_SUMMARY).optional(),
});

type Context = { params: Promise<{ slug: string }> };

const notFound = () => NextResponse.json({ error: "There is no such policy." }, { status: 404 });

export async function PUT(request: Request, context: Context) {
  const { slug } = await context.params;
  if (!isPolicySlug(slug)) return notFound();

  const parsed = policySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `The policy can't be empty, and can be up to ${MAX_POLICY_BODY.toLocaleString("en-IN")} characters. The product page line can be up to ${MAX_POLICY_SUMMARY}.`,
      },
      { status: 400 },
    );
  }

  // Only the returns policy has a product page line, and it cannot be blank: the
  // "Shipping & Returns" box would then say nothing about returns.
  const summary = slug === "returns" ? parsed.data.summary || null : null;
  if (slug === "returns" && !summary) {
    return NextResponse.json({ error: "Add the short returns line shown on product pages." }, { status: 400 });
  }

  // A mistyped tag would reach customers as raw {{...}}.
  const unknown = unknownPlaceholders(parsed.data.body);
  if (unknown.length > 0) {
    return NextResponse.json(
      { error: `Not a tag the shop knows: ${unknown.join(", ")}. Fix or remove it, then save again.` },
      { status: 400 },
    );
  }

  const data = { body: parsed.data.body, summary };
  const saved = await prisma.policy.upsert({
    where: { slug },
    update: data,
    create: { slug, ...data },
  });

  revalidateStorefront();

  return NextResponse.json({ body: saved.body, summary: saved.summary, updatedAt: saved.updatedAt });
}

/** Restores the default text by forgetting the saved one. */
export async function DELETE(_request: Request, context: Context) {
  const { slug } = await context.params;
  if (!isPolicySlug(slug)) return notFound();

  // deleteMany, so restoring a page that was never edited is not an error.
  await prisma.policy.deleteMany({ where: { slug } });

  revalidateStorefront();

  return NextResponse.json({ restored: true });
}
