import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    // Archived sizes are deliberately excluded here — the PATCH route treats
    // their absence from the submitted form as intentional (see its comment),
    // and showing them as ordinary editable "Size" cards misleads the admin
    // into thinking a retired SKU/price is still live.
    include: { sizes: { where: { isArchived: false }, orderBy: { volumeMl: "asc" } } },
  });

  if (!product) notFound();

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Edit {product.name}</h1>
      <div className="mt-8">
        <ProductForm productId={product.id} initial={product} />
      </div>
    </div>
  );
}
