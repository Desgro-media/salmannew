import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { products } from "./seed-data";

async function seedSuperadmin() {
  const email = process.env.SEED_SUPERADMIN_EMAIL;
  const password = process.env.SEED_SUPERADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "SEED_SUPERADMIN_EMAIL and SEED_SUPERADMIN_PASSWORD must be set (see .env.example) before seeding.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, role: "SUPERADMIN" },
    create: { email, passwordHash, role: "SUPERADMIN" },
  });

  console.log(`Seeded superadmin: ${email}`);
}

async function seedProducts() {
  for (const product of products) {
    const row = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
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
        isNew: product.isNew ?? false,
      },
      create: {
        slug: product.slug,
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
        isNew: product.isNew ?? false,
      },
    });

    for (const size of product.sizes) {
      await prisma.productSize.upsert({
        where: { sku: size.sku },
        update: {
          productId: row.id,
          label: size.label,
          volumeMl: size.volumeMl,
          price: size.price,
          compareAtPrice: size.compareAtPrice,
          image: size.image,
          thumb: size.thumb,
        },
        create: {
          id: size.id,
          productId: row.id,
          label: size.label,
          volumeMl: size.volumeMl,
          sku: size.sku,
          price: size.price,
          compareAtPrice: size.compareAtPrice,
          image: size.image,
          thumb: size.thumb,
        },
      });
    }
  }

  console.log(`Seeded ${products.length} products.`);
}

async function main() {
  await seedSuperadmin();
  await seedProducts();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
