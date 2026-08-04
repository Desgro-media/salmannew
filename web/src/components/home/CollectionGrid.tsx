import { products } from "@/lib/products";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";

export function CollectionGrid() {
  return (
    <section id="collection" className="container-grid py-24 md:py-32">
      <div className="flex flex-col items-start justify-between gap-6 border-b border-line pb-8 md:flex-row md:items-end">
        <Reveal>
          <p className="eyebrow text-ink-soft">The Full Range</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
            The Collection
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="max-w-sm text-sm text-ink-soft md:text-right">
            Six scents, ({products.length}) formulas — every one built around
            a single dominant accord, worn on its own terms.
          </p>
        </Reveal>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14">
        {products.map((product, i) => (
          <Reveal key={product.id} delay={(i % 3) * 0.08}>
            <ProductCard product={product} index={i} />
          </Reveal>
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <ButtonLink href="/shop" variant="secondary">
          View Shop
        </ButtonLink>
      </div>
    </section>
  );
}
