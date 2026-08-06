"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";

const CATEGORIES = ["Oriental", "Fresh", "Floral", "Woody", "Musk"] as const;

function SectionCard({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-line bg-paper">
      <div className="flex items-baseline gap-3 border-b border-line bg-paper-2 px-6 py-4">
        <span className="font-mono text-xs text-gold-ink">{step}</span>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em]">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-ink-soft">{description}</p>}
        </div>
      </div>
      <div className="space-y-5 px-6 py-6">{children}</div>
    </section>
  );
}

function UploadButton({
  label,
  multiple,
  onFiles,
}: {
  label: string;
  multiple?: boolean;
  onFiles: (files: FileList | null) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 border border-line px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-colors hover:border-ink hover:bg-ink hover:text-paper">
      {label}
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </label>
  );
}

interface SizeForm {
  id?: string;
  label: string;
  volumeMl: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  image: string;
  thumb: string;
}

interface ProductFormValues {
  slug: string;
  name: string;
  fullName: string;
  tagline: string;
  category: (typeof CATEGORIES)[number];
  description: string;
  story: string;
  notesTop: string;
  notesHeart: string;
  notesBase: string;
  concentration: string;
  accent: string;
  images: string[];
  bestseller: boolean;
  isNew: boolean;
  sizes: SizeForm[];
}

const emptySize: SizeForm = {
  label: "",
  volumeMl: "",
  sku: "",
  price: "",
  compareAtPrice: "",
  image: "",
  thumb: "",
};

const emptyValues: ProductFormValues = {
  slug: "",
  name: "",
  fullName: "",
  tagline: "",
  category: "Fresh",
  description: "",
  story: "",
  notesTop: "",
  notesHeart: "",
  notesBase: "",
  concentration: "Eau de Parfum",
  accent: "#131110",
  images: [],
  bestseller: false,
  isNew: false,
  sizes: [emptySize],
};

export interface ProductFormInitial {
  slug: string;
  name: string;
  fullName: string;
  tagline: string;
  category: string;
  description: string;
  story: string;
  notesTop: string[];
  notesHeart: string[];
  notesBase: string[];
  concentration: string;
  accent: string;
  images: string[];
  bestseller: boolean;
  isNew: boolean;
  sizes: {
    id: string;
    label: string;
    volumeMl: number;
    sku: string;
    price: number;
    compareAtPrice: number | null;
    image: string;
    thumb: string;
  }[];
}

function fromInitial(initial: ProductFormInitial): ProductFormValues {
  return {
    slug: initial.slug,
    name: initial.name,
    fullName: initial.fullName,
    tagline: initial.tagline,
    category: initial.category as ProductFormValues["category"],
    description: initial.description,
    story: initial.story,
    notesTop: initial.notesTop.join("\n"),
    notesHeart: initial.notesHeart.join("\n"),
    notesBase: initial.notesBase.join("\n"),
    concentration: initial.concentration,
    accent: initial.accent,
    images: initial.images,
    bestseller: initial.bestseller,
    isNew: initial.isNew,
    sizes: initial.sizes.map((s) => ({
      id: s.id,
      label: s.label,
      volumeMl: String(s.volumeMl),
      sku: s.sku,
      price: String(s.price),
      compareAtPrice: s.compareAtPrice != null ? String(s.compareAtPrice) : "",
      image: s.image,
      thumb: s.thumb,
    })),
  };
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.set("file", file);
  const res = await fetch("/api/admin/uploads", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed.");
  const { url } = await res.json();
  return url;
}

export function ProductForm({
  productId,
  initial,
}: {
  productId?: string;
  initial?: ProductFormInitial;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(
    initial ? fromInitial(initial) : emptyValues,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function updateSize(index: number, patch: Partial<SizeForm>) {
    setValues((v) => ({
      ...v,
      sizes: v.sizes.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }

  async function handleGalleryUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadFile));
      setValues((v) => ({ ...v, images: [...v.images, ...urls] }));
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSizeImageUpload(index: number, field: "image" | "thumb", files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      updateSize(index, { [field]: url });
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (values.images.length === 0) {
      setError("Add at least one product photo.");
      return;
    }

    const payload = {
      slug: values.slug,
      name: values.name,
      fullName: values.fullName,
      tagline: values.tagline,
      category: values.category,
      description: values.description,
      story: values.story,
      notes: {
        top: values.notesTop.split("\n").map((s) => s.trim()).filter(Boolean),
        heart: values.notesHeart.split("\n").map((s) => s.trim()).filter(Boolean),
        base: values.notesBase.split("\n").map((s) => s.trim()).filter(Boolean),
      },
      concentration: values.concentration,
      accent: values.accent,
      images: values.images,
      bestseller: values.bestseller,
      isNew: values.isNew,
      sizes: values.sizes.map((s) => ({
        id: s.id,
        label: s.label,
        volumeMl: Number(s.volumeMl),
        sku: s.sku,
        price: Math.round(Number(s.price)),
        compareAtPrice: s.compareAtPrice ? Math.round(Number(s.compareAtPrice)) : undefined,
        image: s.image,
        thumb: s.thumb || s.image,
      })),
    };

    setSubmitting(true);
    try {
      const res = await fetch(
        productId ? `/api/admin/products/${productId}` : "/api/admin/products",
        {
          method: productId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(typeof body?.error === "string" ? body.error : "Could not save product.");
        setSubmitting(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl pb-28">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
        <SectionCard step="01" title="Basics" description="What the product is called and how it's grouped.">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Slug (url path)">
              <Input
                required
                value={values.slug}
                onChange={(e) => update("slug", e.target.value)}
                placeholder="imperial"
              />
            </Field>
            <Field label="Category">
              <select
                required
                value={values.category}
                onChange={(e) => update("category", e.target.value as ProductFormValues["category"])}
                className="mt-1.5 w-full border border-line bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ink"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Name">
              <Input required value={values.name} onChange={(e) => update("name", e.target.value)} />
            </Field>
            <Field label="Full name (product page title)">
              <Input
                required
                value={values.fullName}
                onChange={(e) => update("fullName", e.target.value)}
              />
            </Field>
            <Field label="Tagline" className="sm:col-span-2">
              <Input required value={values.tagline} onChange={(e) => update("tagline", e.target.value)} />
            </Field>
            <Field label="Concentration">
              <Input
                required
                value={values.concentration}
                onChange={(e) => update("concentration", e.target.value)}
              />
            </Field>
            <Field label="Accent color (hex)">
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className="h-9 w-9 shrink-0 border border-line"
                  style={{ backgroundColor: values.accent }}
                />
                <Input
                  required
                  className="mt-0"
                  value={values.accent}
                  onChange={(e) => update("accent", e.target.value)}
                />
              </div>
            </Field>
          </div>
          <div className="flex gap-6 border-t border-line pt-5 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--color-ink)]"
                checked={values.bestseller}
                onChange={(e) => update("bestseller", e.target.checked)}
              />
              Bestseller
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--color-ink)]"
                checked={values.isNew}
                onChange={(e) => update("isNew", e.target.checked)}
              />
              New
            </label>
          </div>
        </SectionCard>

        <SectionCard step="03" title="Gallery Photos" description="Shown on the shop grid and product page.">
          {values.images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {values.images.map((url, i) => (
                <div key={url + i} className="group relative h-24 w-20 overflow-hidden border border-line">
                  <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => update("images", values.images.filter((_, idx) => idx !== i))}
                    className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center bg-ink text-xs text-paper opacity-80 transition-opacity hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <UploadButton label="+ Add Photos" multiple onFiles={handleGalleryUpload} />
        </SectionCard>
        </div>

        <div className="space-y-6">
        <SectionCard step="02" title="Story" description="The copy shown on the product page.">
          <Field label="Description">
            <Textarea
              required
              rows={4}
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </Field>
          <Field label="Story">
            <Textarea
              required
              rows={4}
              value={values.story}
              onChange={(e) => update("story", e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Field label="Top notes (one per line)">
              <Textarea rows={4} value={values.notesTop} onChange={(e) => update("notesTop", e.target.value)} />
            </Field>
            <Field label="Heart notes (one per line)">
              <Textarea
                rows={4}
                value={values.notesHeart}
                onChange={(e) => update("notesHeart", e.target.value)}
              />
            </Field>
            <Field label="Base notes (one per line)">
              <Textarea rows={4} value={values.notesBase} onChange={(e) => update("notesBase", e.target.value)} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard step="04" title="Sizes &amp; Prices" description="At least one size is required.">
          <div className="space-y-5">
            {values.sizes.map((size, i) => (
              <div key={i} className="border border-line">
                <div className="flex items-center justify-between border-b border-line bg-paper-2 px-4 py-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
                    Size {i + 1}
                  </span>
                  {values.sizes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => update("sizes", values.sizes.filter((_, idx) => idx !== i))}
                      className="text-xs font-semibold uppercase tracking-[0.08em] text-red-700 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Label">
                      <Input
                        required
                        value={size.label}
                        onChange={(e) => updateSize(i, { label: e.target.value })}
                        placeholder="30 ml"
                      />
                    </Field>
                    <Field label="Volume (ml)">
                      <Input
                        required
                        type="number"
                        value={size.volumeMl}
                        onChange={(e) => updateSize(i, { volumeMl: e.target.value })}
                      />
                    </Field>
                    <Field label="SKU">
                      <Input
                        required
                        value={size.sku}
                        onChange={(e) => updateSize(i, { sku: e.target.value })}
                        placeholder="SP-XXX-030"
                      />
                    </Field>
                    <Field label="Price (₹)">
                      <Input
                        required
                        type="number"
                        value={size.price}
                        onChange={(e) => updateSize(i, { price: e.target.value })}
                      />
                    </Field>
                    <Field label="Compare-at price (₹, optional)">
                      <Input
                        type="number"
                        value={size.compareAtPrice}
                        onChange={(e) => updateSize(i, { compareAtPrice: e.target.value })}
                      />
                    </Field>
                  </div>
                  <div className="mt-4 flex flex-wrap items-end gap-6 border-t border-line pt-4">
                    <div>
                      <span className="text-xs font-medium text-ink-soft">Size photo</span>
                      <div className="mt-1.5 flex items-center gap-3">
                        {size.image && (
                          <div className="relative h-16 w-14 overflow-hidden border border-line">
                            <Image src={size.image} alt="" fill sizes="56px" className="object-cover" />
                          </div>
                        )}
                        <UploadButton
                          label={size.image ? "Replace" : "Upload"}
                          onFiles={(files) => handleSizeImageUpload(i, "image", files)}
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-ink-soft">Thumbnail (optional)</span>
                      <div className="mt-1.5 flex items-center gap-3">
                        {size.thumb && (
                          <div className="relative h-16 w-14 overflow-hidden border border-line">
                            <Image src={size.thumb} alt="" fill sizes="56px" className="object-cover" />
                          </div>
                        )}
                        <UploadButton
                          label={size.thumb ? "Replace" : "Upload"}
                          onFiles={(files) => handleSizeImageUpload(i, "thumb", files)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => update("sizes", [...values.sizes, { ...emptySize }])}
            className="text-xs font-semibold uppercase tracking-[0.08em] hover:text-gold-ink"
          >
            + Add another size
          </button>
        </SectionCard>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 backdrop-blur-sm">
        <div className="container-grid flex items-center justify-between gap-4 py-4">
          {error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : (
            <p className="text-sm text-ink-soft">
              {uploading ? "Uploading photo…" : "Fields marked required must be filled in."}
            </p>
          )}
          <Button type="submit" disabled={submitting || uploading} className="shrink-0">
            {submitting ? "Saving…" : uploading ? "Uploading…" : "Save Product"}
          </Button>
        </div>
      </div>
    </form>
  );
}
