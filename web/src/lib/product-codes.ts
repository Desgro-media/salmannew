import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";

// Product codes (SKUs) are what ties a size to the outside world: they are copied
// onto every order line, and a courier or inventory system that matches products
// by code only works if one code means one size, permanently.
//
// The database already enforces that (`ProductSize.sku` is unique) — but only by
// throwing, and the admin routes used to let that surface as an unexplained
// failure. Worse, a size's primary key used to be its code lower-cased, so the
// edit route could "update" a different product's size instead of creating one.
// Everything that decides whether a code is usable lives here, so creating a
// product, editing one, and the form's live check cannot disagree.

type Db = Pick<PrismaClient, "productSize">;

export interface CodeInput {
  sku: string;
  /** The saved size this code belongs to, when the form is editing one. */
  sizeId?: string;
}

export interface CodeConflict {
  /** Position in the list that was checked, so the form can find the size. */
  index: number;
  sku: string;
  /** `taken`: another size already has it. `repeated`: it appears twice on this form. */
  kind: "taken" | "repeated";
  /** The size that has it, e.g. "Imperial (50 ml)". Empty for `repeated`. */
  heldBy: string;
  /** The holder is archived, so the admin can't see it in the shop or the Edit form. */
  archived: boolean;
  /** A code that is free right now. */
  suggestion: string;
  /** One sentence the admin can act on. */
  message: string;
}

/**
 * Thrown from inside a transaction so everything written so far rolls back, and
 * caught by the route to answer 409. The body is what the form reads.
 */
export class SaveConflict extends Error {
  constructor(readonly body: { error: string; skuConflicts?: CodeConflict[] }) {
    super(body.error);
  }
}

export function codeConflictBody(conflicts: CodeConflict[]) {
  return { error: conflicts.map((c) => c.message).join(" "), skuConflicts: conflicts };
}

/** Postgres refused a second copy of something unique (a slug, a code, a size id). */
export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

/**
 * A fresh primary key for a size. It is deliberately unrelated to the code: ids
 * derived from the code collided with other products' sizes (and, through the
 * upsert in the edit route, silently overwrote them).
 */
export function newSizeId(): string {
  return `size_${randomUUID()}`;
}

/**
 * Which of these codes can't be used, and what to use instead.
 *
 * A code is taken by *any* size in the database — archived sizes and archived
 * products included. Those are invisible in the admin but still own their code,
 * because OrderItem keeps pointing at it, so reusing one would blur two products
 * together in every old order.
 *
 * Comparison ignores case ("sp-imp-050" is "SP-IMP-050" to a person) even though
 * the column's own uniqueness doesn't, so look-alikes are refused up front.
 */
export async function findCodeConflicts(db: Db, items: CodeInput[]): Promise<CodeConflict[]> {
  const wanted = items
    .map((item, index) => ({ index, sku: item.sku.trim(), sizeId: item.sizeId }))
    .filter((w) => w.sku !== "");
  if (wanted.length === 0) return [];

  const rows = await db.productSize.findMany({
    where: { OR: wanted.map((w) => ({ sku: { equals: w.sku, mode: "insensitive" as const } })) },
    select: {
      id: true,
      sku: true,
      label: true,
      isArchived: true,
      product: { select: { name: true, isArchived: true } },
    },
  });

  const seen = new Set<string>();
  const found: Pick<CodeConflict, "index" | "sku" | "kind" | "heldBy" | "archived">[] = [];

  for (const w of wanted) {
    const key = w.sku.toLowerCase();
    // A size keeps its own code: only a *different* row holding it is a clash.
    const holder = rows.find((r) => r.sku.toLowerCase() === key && r.id !== w.sizeId);

    if (holder) {
      found.push({
        index: w.index,
        sku: w.sku,
        kind: "taken",
        heldBy: `${holder.product.name} (${holder.label})`,
        archived: holder.isArchived || holder.product.isArchived,
      });
    } else if (seen.has(key)) {
      found.push({ index: w.index, sku: w.sku, kind: "repeated", heldBy: "", archived: false });
    }
    seen.add(key);
  }

  // Codes already spoken for on this form, so two clashes never get the same suggestion.
  const reserved = new Set(wanted.map((w) => w.sku.toLowerCase()));
  const conflicts: CodeConflict[] = [];
  for (const c of found) {
    const suggestion = await freeCode(db, c.sku, reserved);
    conflicts.push({ ...c, suggestion, message: describe(c, suggestion) });
  }
  return conflicts;
}

function describe(
  c: Pick<CodeConflict, "sku" | "kind" | "heldBy" | "archived">,
  suggestion: string,
): string {
  if (c.kind === "repeated") {
    return `${c.sku} is used by more than one size here — each size needs its own code. Try ${suggestion}.`;
  }
  return `${c.sku} is already used by ${c.heldBy}${c.archived ? ", which is archived" : ""}. Try ${suggestion}.`;
}

/** `base-2`, `base-3`, … — the first one nothing has, in the database or on this form. */
async function freeCode(db: Db, base: string, reserved: Set<string>): Promise<string> {
  const rows = await db.productSize.findMany({
    where: { sku: { startsWith: base, mode: "insensitive" } },
    select: { sku: true },
  });
  const used = new Set(rows.map((r) => r.sku.toLowerCase()));

  for (let n = 2; n < 1000; n++) {
    const code = `${base}-${n}`;
    const key = code.toLowerCase();
    if (!used.has(key) && !reserved.has(key)) {
      reserved.add(key);
      return code;
    }
  }
  // A thousand variants of one code is not a real catalogue; stay total anyway.
  return `${base}-${randomUUID().slice(0, 6).toUpperCase()}`;
}
