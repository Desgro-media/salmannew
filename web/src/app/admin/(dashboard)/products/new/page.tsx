import { ProductForm } from "@/components/admin/ProductForm";
import { getLinkableProducts } from "@/lib/admin-products";

// Reads the catalogue for the gift-set "What's inside" picker, so it must not
// be frozen at build time.
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const catalog = await getLinkableProducts();
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">New Product</h1>
      <div className="mt-8">
        <ProductForm catalog={catalog} />
      </div>
    </div>
  );
}
