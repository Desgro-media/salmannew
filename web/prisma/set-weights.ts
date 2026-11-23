/**
 * Put each size's weight (grams) on its row, matched by SKU, from
 * prisma/size-weights.ts — into whatever database DATABASE_URL points at.
 *
 * Why this exists rather than `sync-catalogue.ts`: that script makes the database
 * match seed-data.ts and ARCHIVES every size it does not list, which would hide any
 * product added through the admin. This one changes a single column, ProductSize.
 * weightGrams, and nothing else: it never creates, archives, deletes, or edits a
 * price, name or photo.
 *
 * It does nothing unless asked: by default it only prints what it would change.
 * A weight already on a size is kept unless --overwrite is given, so a figure
 * someone entered in the admin is never replaced by accident.
 *
 * Usage (from web/):
 *   DATABASE_URL="postgresql://…" npx tsx prisma/set-weights.ts                       # preview
 *   DATABASE_URL="postgresql://…" npx tsx prisma/set-weights.ts --apply               # write
 *   DATABASE_URL="postgresql://…" npx tsx prisma/set-weights.ts --apply --overwrite   # also replace weights already there
 */

import { config } from "dotenv";
// Same order as prisma.config.ts. dotenv never overwrites a variable already in the
// environment, so `DATABASE_URL=… npx tsx …` still wins over the local .env.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { SIZE_WEIGHTS } from "./size-weights";

const apply = process.argv.includes("--apply");
const overwrite = process.argv.includes("--overwrite");

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  // Host only — never print credentials.
  console.log(`Target: ${url.replace(/\/\/[^@]+@/, "//***@").split("?")[0]}`);
  console.log(apply ? "APPLYING.\n" : "PREVIEW — nothing will be written. Add --apply to write.\n");

  const rows = await prisma.productSize.findMany({
    where: { sku: { in: Object.keys(SIZE_WEIGHTS) } },
    select: { id: true, sku: true, weightGrams: true, product: { select: { name: true } } },
    orderBy: { sku: "asc" },
  });

  const toWrite: { id: string; grams: number }[] = [];
  for (const row of rows) {
    const want = SIZE_WEIGHTS[row.sku];
    const note = want.estimated ? "  (estimate — no photo)" : "";
    const label = `${row.sku.padEnd(11)} ${row.product.name.padEnd(14)}`;

    if (row.weightGrams === want.grams) {
      console.log(`  same     ${label} ${want.grams} g`);
    } else if (row.weightGrams !== null && !overwrite) {
      console.log(`  KEPT     ${label} has ${row.weightGrams} g, file says ${want.grams} g (use --overwrite to replace)`);
    } else {
      console.log(`  ${row.weightGrams === null ? "set     " : "REPLACE "} ${label} ${row.weightGrams ?? "—"} -> ${want.grams} g${note}`);
      toWrite.push({ id: row.id, grams: want.grams });
    }
  }

  const found = new Set(rows.map((r) => r.sku));
  const missing = Object.keys(SIZE_WEIGHTS).filter((sku) => !found.has(sku));
  if (missing.length > 0) {
    console.log(`\nNot in this database (skipped): ${missing.join(", ")}`);
  }

  if (apply && toWrite.length > 0) {
    await prisma.$transaction(toWrite.map((w) => prisma.productSize.update({ where: { id: w.id }, data: { weightGrams: w.grams } })));
  }
  console.log(`\n${apply ? "Wrote" : "Would write"} ${toWrite.length} weight(s); ${rows.length} of ${Object.keys(SIZE_WEIGHTS).length} SKUs found.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
