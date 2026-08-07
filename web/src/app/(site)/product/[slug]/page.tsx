import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToCartPanel } from "@/components/product/AddToCartPanel";
import { ProductSelectionProvider } from "@/lib/product-selection-context";
import { NotesPyramid } from "@/components/product/NotesPyramid";
import { AccordionItem } from "@/components/ui/Accordion";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/motion/Reveal";

// Products are admin-managed in the DB now, so params can't be enumerated
// statically at build time. ISR keeps pages fast while picking up admin
// edits within a minute (see revalidatePath calls in the admin product API).
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.fullName} — Salman Perfumes`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(slug, 3);

  return (
    <div className="pt-16 md:pt-20">
      <div className="container-grid py-4 text-xs text-ink-soft">
        <span>Shop</span> <span className="mx-1.5">/</span>{" "}
        <span className="text-ink">{product.name}</span>
      </div>

      <ProductSelectionProvider>
        <div className="container-grid grid grid-cols-1 gap-12 pb-24 md:grid-cols-12 md:gap-8 md:pb-32">
          <div className="md:col-span-7">
            <ProductGallery
              images={product.images}
              name={product.fullName}
              accent={product.accent}
            />
          </div>

          <div className="md:col-span-4 md:col-start-9">
            <span className="inline-block rounded-full bg-paper-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              {product.category}
            </span>
            <h1 className="mt-3 text-4xl font-black tracking-tight">
              {product.name}
            </h1>
            <p className="mt-2 text-ink-soft">{product.tagline}</p>

            <div className="mt-8">
              <AddToCartPanel product={product} />
            </div>

            <p className="mt-8 leading-relaxed text-ink-soft">
              {product.description}
            </p>

            <div className="mt-8">
              <NotesPyramid notes={product.notes} accent={product.accent} />
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <AccordionItem title="The Story" defaultOpen>
                {product.story}
              </AccordionItem>
              <AccordionItem title="Shipping & Returns">
                Dispatched in 2–4 business days. Free shipping on orders over
                ₹2,999. Unopened bottles can be returned within 14 days of
                delivery.
              </AccordionItem>
              <AccordionItem title="How to Apply">
                Spray on pulse points — wrists, neck, behind the ears. Eau de
                Parfum concentration lasts 6–8 hours; avoid rubbing the skin
                after application.
              </AccordionItem>
            </div>
          </div>
        </div>
      </ProductSelectionProvider>

      {related.length > 0 && (
        <section className="container-grid border-t border-line py-20 md:py-28">
          <Reveal>
            <p className="eyebrow text-ink-soft">Keep Exploring</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              You Might Also Like
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
