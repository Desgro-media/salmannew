import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts, products } from "@/lib/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToCartPanel } from "@/components/product/AddToCartPanel";
import { NotesPyramid } from "@/components/product/NotesPyramid";
import { AccordionItem } from "@/components/ui/Accordion";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/motion/Reveal";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
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
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = getRelatedProducts(slug, 3);

  return (
    <div className="pt-16 md:pt-20">
      <div className="container-grid py-4 text-xs text-ink-soft">
        <span>Shop</span> <span className="mx-1.5">/</span>{" "}
        <span className="text-ink">{product.name}</span>
      </div>

      <div className="container-grid grid grid-cols-1 gap-12 pb-24 md:grid-cols-12 md:gap-8 md:pb-32">
        <div className="md:col-span-7">
          <ProductGallery images={product.images} name={product.fullName} />
        </div>

        <div className="md:col-span-4 md:col-start-9">
          <p className="eyebrow text-ink-soft">{product.category}</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
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
            <NotesPyramid notes={product.notes} />
          </div>

          <div className="mt-2">
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

      {related.length > 0 && (
        <section className="container-grid border-t border-line py-20 md:py-28">
          <Reveal>
            <p className="eyebrow text-ink-soft">Keep Exploring</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              You Might Also Like
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <ProductCard product={p} index={i} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
