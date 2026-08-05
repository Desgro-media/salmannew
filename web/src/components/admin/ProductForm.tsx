"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";

const CATEGORIES = ["Oriental", "Fresh", "Floral", "Woody", "Musk"] as const;

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

  async function handleSizeImageUpload(index: number, field: "image" | "thumb", file: File | undefined) {
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
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-10">
      <section className="space-y-5">
        <p className="eyebrow text-ink-soft">Basics</p>
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
            <Input required value={values.accent} onChange={(e) => update("accent", e.target.value)} />
          </Field>
        </div>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={values.bestseller}
              onChange={(e) => update("bestseller", e.target.checked)}
            />
            Bestseller
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={values.isNew}
              onChange={(e) => update("isNew", e.target.checked)}
            />
            New
          </label>
        </div>
      </section>

      <section className="space-y-5">
        <p className="eyebrow text-ink-soft">Story</p>
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
      </section>

      <section className="space-y-5">
        <p className="eyebrow text-ink-soft">Gallery Photos</p>
        <div className="flex flex-wrap gap-3">
          {values.images.map((url, i) => (
            <div key={url + i} className="relative h-24 w-20 overflow-hidden border border-line">
              <Image src={url} alt="" fill sizes="80px" className="object-cover" />
              <button
                type="button"
                onClick={() => update("images", values.images.filter((_, idx) => idx !== i))}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center bg-ink text-xs text-paper"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleGalleryUpload(e.target.files)}
        />
      </section>

      <section className="space-y-5">
        <p className="eyebrow text-ink-soft">Sizes &amp; Prices</p>
        <div className="space-y-6">
          {values.sizes.map((size, i) => (
            <div key={i} className="border border-line p-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
              <div className="mt-4 flex flex-wrap items-end gap-6">
                <div>
                  <span className="text-xs font-medium text-ink-soft">Size photo</span>
                  <div className="mt-1.5 flex items-center gap-3">
                    {size.image && (
                      <div className="relative h-16 w-14 overflow-hidden border border-line">
                        <Image src={size.image} alt="" fill sizes="56px" className="object-cover" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSizeImageUpload(i, "image", e.target.files?.[0])}
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
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSizeImageUpload(i, "thumb", e.target.files?.[0])}
                    />
                  </div>
                </div>
                {values.sizes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => update("sizes", values.sizes.filter((_, idx) => idx !== i))}
                    className="text-xs font-semibold uppercase tracking-[0.08em] text-red-700"
                  >
                    Remove size
                  </button>
                )}
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
      </section>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <Button type="submit" disabled={submitting || uploading}>
        {submitting ? "Saving…" : uploading ? "Uploading…" : "Save Product"}
      </Button>
    </form>
  );
}
