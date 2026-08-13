/**
 * Push the catalogue in seed-data.ts into whatever database DATABASE_URL points
 * at, without touching anything else.
 *
 * Why this exists rather than `prisma db seed`:
 *
 *  - `seed.ts` also runs seedSuperadmin(), which upserts the admin account and
 *    OVERWRITES its password hash with SEED_SUPERADMIN_PASSWORD. Run that against
 *    production and you have silently reset the live admin login. This script
 *    never touches the Admin table.
 *  - `build` runs `prisma migrate deploy`, so a deploy brings the schema up to
 *    date but never the data. Products, prices and sizes therefore stay frozen
 *    at whatever was last written to that database, no matter what ships in the
 *    code — which is why a deploy can show a new Privé filter with nothing under
 *    it, and old prices on the cards.
 *
 * Sizes that are no longer in seed-data are ARCHIVED, not deleted: OrderItem
 * references ProductSize with onDelete: Restrict, so anything ever bought
 * refuses to be removed, and past orders should keep the link regardless.
 * Archived sizes are hidden from the storefront by the query in lib/products.ts.
 *
 * Usage (from web/):
 *   DATABASE_URL="postgresql://…" npx tsx prisma/sync-catalogue.ts
 *   DATABASE_URL="postgresql://…" npx tsx prisma/sync-catalogue.ts --dry-run
 *
 * Idempotent — running it twice changes nothing the second time.
 */

import { config } from "dotenv";
// Same order as prisma.config.ts. dotenv never overwrites a variable already in
// the environment, so `DATABASE_URL=… npx tsx …` still wins over the local .env
// — which is what makes aiming this at another database a one-line command.
config({ path: ".env.local" });
config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { products } from "./seed-data";

const dryRun = process.argv.includes("--dry-run");
// Built here rather than imported from src/lib/db so the connection string is
// read at run time — the whole point is to aim this at a database other than
// the local one by setting DATABASE_URL for the single command.
const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
});

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  // Host only — never print credentials.
  console.log(`Target: ${url.replace(/\/\/[^@]+@/, "//***@").split("?")[0]}`);
  if (dryRun) console.log("DRY RUN — no writes will be made.\n");

  const keptSkus = new Set<string>();
  let created = 0;
  let updated = 0;

  for (const product of products) {
    for (const size of product.sizes) keptSkus.add(size.sku);

    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
      select: { id: true },
    });

    const fields = {
      name: product.name,
      fullName: product.fullName,
      tagline: product.tagline,
      category: product.category,
      description: product.description,
      story: product.story,
      notesTop: product.notes.top,
      notesHeart: product.notes.heart,
      notesBase: product.notes.base,
      concentration: product.concentration,
      accent: product.accent,
      images: product.images,
      bestseller: product.bestseller ?? false,
      signature: product.signature ?? false,
      isNew: product.isNew ?? false,
    };

    if (existing) updated++;
    else created++;
    console.log(`${existing ? "update" : "CREATE"}  ${product.slug}`);

    if (dryRun) continue;

    const row = await prisma.product.upsert({
      where: { slug: product.slug },
      update: fields,
      create: { slug: product.slug, ...fields },
    });

    for (const size of product.sizes) {
      await prisma.productSize.upsert({
        where: { sku: size.sku },
        update: {
          productId: row.id,
          label: size.label,
          volumeMl: size.volumeMl,
          price: size.price,
          compareAtPrice: size.compareAtPrice ?? null,
          image: size.image,
          thumb: size.thumb,
          isArchived: false,
        },
        create: {
          id: size.id,
          productId: row.id,
          label: size.label,
          volumeMl: size.volumeMl,
          sku: size.sku,
          price: size.price,
          compareAtPrice: size.compareAtPrice ?? null,
          image: size.image,
          thumb: size.thumb,
        },
      });
      console.log(`         ${size.sku}  ${size.label}  ${size.price}`);
    }
  }

  // Anything the catalogue no longer lists — the old 30 ml tier, Latheer's
  // superseded 50 ml — is retired rather than removed.
  const stale = await prisma.productSize.findMany({
    where: { sku: { notIn: [...keptSkus] }, isArchived: false },
    select: { sku: true, label: true, price: true },
  });

  if (stale.length === 0) {
    console.log("\nNo stale sizes to archive.");
  } else {
    console.log(`\nArchiving ${stale.length} size(s) no longer in the catalogue:`);
    for (const s of stale) console.log(`  ${s.sku}  ${s.label}  ${s.price}`);
    if (!dryRun) {
      await prisma.productSize.updateMany({
        where: { sku: { notIn: [...keptSkus] }, isArchived: false },
        data: { isArchived: true },
      });
    }
  }

  console.log(
    `\n${dryRun ? "Would sync" : "Synced"} ${products.length} products (${created} new, ${updated} existing).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
