"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { formatPrice } from "@/lib/format";
import {
  BAKHOOR_CATEGORY,
  PRODUCT_CATEGORIES,
  categoryLabel,
  productKind,
  type ProductKind,
} from "@/lib/shop-filters";
import { parseSetItems } from "@/lib/set-items";

const CATEGORIES = PRODUCT_CATEGORIES;
const CONCENTRATIONS = ["Eau de Parfum", "Eau de Toilette", "Parfum", "Eau de Cologne"] as const;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

// Liquids are sold by volume (ml, L), solids and attars by weight (gm, kg) or
// the traditional tola; oz covers imported bottles. The number is always a
// whole number, so a smaller unit is the way to express a fraction (500 gm, not 0.5 kg).
const SIZE_UNITS = ["ml", "gm", "tola", "oz", "L", "kg"] as const;
type SizeUnit = (typeof SIZE_UNITS)[number];

/** Reads the unit back out of a saved label like "50 gm". Labels from before
 *  gm existed said "mg"; they map to gm so re-saving corrects them. */
function unitFromLabel(label: string): SizeUnit {
  const word = label.match(/([a-z]+)\s*$/i)?.[1].toLowerCase();
  if (word === "mg" || word === "g" || word === "gms" || word === "gram" || word === "grams") return "gm";
  return SIZE_UNITS.find((u) => u.toLowerCase() === word) ?? "ml";
}

function suggestSku(slug: string, volumeMl: string, unit: SizeUnit = "ml"): string {
  const prefix = (slugify(slug).replace(/-/g, "").slice(0, 3) || "prd").toUpperCase();
  const vol = volumeMl ? volumeMl.padStart(3, "0") : "000";
  // ml keeps the original SP-IMP-030 shape so existing codes don't change; any
  // other unit gets its own suffix so it can't collide with a same-numbered ml size.
  return `SP-${prefix}-${vol}${unit === "ml" ? "" : unit.toUpperCase()}`;
}

/**
 * Whether a code is one this form suggested itself, as opposed to one the admin
 * typed. Only those follow the name and size around, and only those may be swapped
 * for a free code without asking. A suggestion that turned out to be taken becomes
 * `-2`, `-3`… (see lib/product-codes.ts), and still counts as ours.
 */
function isAutoSku(sku: string, slug: string, volumeMl: string, unit: SizeUnit): boolean {
  const base = suggestSku(slug, volumeMl, unit);
  if (sku === "" || sku === base) return true;
  return sku.startsWith(`${base}-`) && /^\d+$/.test(sku.slice(base.length + 1));
}

/**
 * The suggested code is built from the product's web address, so when that changes
 * the codes of sizes that haven't been saved yet change with it — otherwise a size
 * filled in before the name keeps "SP-PRD-…" and the next product's collides with it.
 * Saved sizes keep theirs: by then the code is on orders and in other systems.
 */
function followSlug(sizes: SizeForm[], oldSlug: string, newSlug: string, isSet: boolean): SizeForm[] {
  if (isSet || oldSlug === newSlug) return sizes;
  return sizes.map((s) =>
    !s.id && s.sku !== "" && isAutoSku(s.sku, oldSlug, s.volumeMl, s.unit)
      ? { ...s, sku: suggestSku(newSlug, s.volumeMl, s.unit) }
      : s,
  );
}

/** One row of the server's answer to "which of these codes can't be used?" */
interface SkuConflict {
  index: number;
  sku: string;
  kind: "taken" | "repeated";
  heldBy: string;
  suggestion: string;
  message: string;
}

interface SkuIssue {
  message: string;
  suggestion: string;
}

function pickedNote(c: SkuConflict): string {
  return c.kind === "repeated"
    ? `${c.sku} was already on another size here, so ${c.suggestion} was picked instead.`
    : `${c.sku} is already used by ${c.heldBy}, so ${c.suggestion} was picked instead.`;
}

function discountSummary(price: string, compareAtPrice: string): string | null {
  const p = Number(price);
  const c = Number(compareAtPrice);
  if (!p || !c || c <= p) return null;
  const pct = Math.round(((c - p) / c) * 100);
  return `Customers will see ${formatPrice(c)} crossed out, then ${formatPrice(p)} — ${pct}% off.`;
}

function SectionCard({
  step,
  title,
  description,
  issues = 0,
  children,
}: {
  step: string;
  title: string;
  description?: string;
  /** unfilled fields in this section; turns the whole card red so it's easy to spot */
  issues?: number;
  children: ReactNode;
}) {
  const hasIssues = issues > 0;
  return (
    <section className={`border bg-paper ${hasIssues ? "border-red-600" : "border-line"}`}>
      <div
        className={`flex items-baseline gap-3 border-b px-6 py-4 ${
          hasIssues ? "border-red-600 bg-red-50" : "border-line bg-paper-2"
        }`}
      >
        <span className={`font-mono text-xs ${hasIssues ? "text-red-700" : "text-gold-ink"}`}>{step}</span>
        <div className="flex-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em]">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-ink-soft">{description}</p>}
        </div>
        {hasIssues && (
          <span className="shrink-0 bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-white">
            {issues} to fix
          </span>
        )}
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
  /** a set's option name ("Gift Box"); single perfumes derive it from volumeMl */
  label: string;
  /** the number typed in the Size box; its unit is `unit` (ml, gm, tola, ...) */
  volumeMl: string;
  unit: SizeUnit;
  sku: string;
  price: string;
  onSale: boolean;
  compareAtPrice: string;
  /** grams of the sealed box on a scale; "" = not weighed yet */
  weightGrams: string;
  image: string;
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
  signature: boolean;
  isNew: boolean;
  isSet: boolean;
  setItems: SetItemForm[];
  sizes: SizeForm[];
}

interface SetItemForm {
  name: string;
  size: string;
  /** "" when the item isn't a catalogue product */
  productSlug: string;
}

const emptySetItem: SetItemForm = { name: "", size: "", productSlug: "" };

export interface CatalogEntry {
  slug: string;
  name: string;
  fullName: string;
}

const emptySize: SizeForm = {
  label: "",
  volumeMl: "",
  unit: "ml",
  sku: "",
  price: "",
  onSale: false,
  compareAtPrice: "",
  weightGrams: "",
  image: "",
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
  signature: false,
  isNew: false,
  isSet: false,
  setItems: [emptySetItem],
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
  signature: boolean;
  isNew: boolean;
  isSet: boolean;
  /** the stored JSON column, parsed in fromInitial */
  setItems: unknown;
  sizes: {
    id: string;
    label: string;
    volumeMl: number;
    sku: string;
    price: number;
    compareAtPrice: number | null;
    weightGrams?: number | null;
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
    signature: initial.signature,
    isNew: initial.isNew,
    isSet: initial.isSet,
    setItems: (() => {
      const items = parseSetItems(initial.setItems).map((item) => ({
        name: item.name,
        size: item.size,
        productSlug: item.productSlug ?? "",
      }));
      return items.length > 0 ? items : [emptySetItem];
    })(),
    sizes: initial.sizes.map((s) => ({
      id: s.id,
      label: s.label,
      volumeMl: String(s.volumeMl),
      // Only the label records the unit (volumeMl is just the number), so read
      // it back from there: "10 gm" reopens as gm, "1 tola" as tola, and so on.
      unit: unitFromLabel(s.label),
      sku: s.sku,
      price: String(s.price),
      onSale: s.compareAtPrice != null,
      compareAtPrice: s.compareAtPrice != null ? String(s.compareAtPrice) : "",
      weightGrams: s.weightGrams != null ? String(s.weightGrams) : "",
      image: s.image,
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

type FormErrors = Record<string, string>;

/**
 * Every field that would stop the product from saving, keyed by where it lives
 * (`name`, `size.0.price`, `setItem.1.size`, …). Runs on all fields at once so
 * the form can mark each one in red rather than reporting only the first.
 * These mirror what the server's schema (admin-schema.ts) rejects.
 */
function validate(values: ProductFormValues): FormErrors {
  const e: FormErrors = {};
  const required = "Required";

  if (!values.name.trim()) e.name = required;
  if (!values.tagline.trim()) e.tagline = required;
  if (!values.description.trim()) e.description = required;
  if (!values.story.trim()) e.story = required;
  // Both normally fill themselves in from the name; they're only empty here if
  // the name is empty or has no letters or digits to build an address from.
  if (!values.slug.trim()) e.slug = required;
  if (!values.fullName.trim()) e.fullName = required;
  if (values.images.length === 0) e.images = "Add at least one product photo.";

  if (values.isSet) {
    // Fully blank rows are ignored on save, so only half-filled rows are wrong,
    // plus the case where nothing at all is listed.
    const filled = values.setItems
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => item.name.trim() || item.size.trim());
    if (filled.length === 0) {
      e["setItem.0.name"] = required;
      e["setItem.0.size"] = required;
    }
    for (const { item, i } of filled) {
      if (!item.name.trim()) e[`setItem.${i}.name`] = required;
      if (!item.size.trim()) e[`setItem.${i}.size`] = required;
    }
  }

  values.sizes.forEach((size, i) => {
    if (values.isSet) {
      if (!size.label.trim()) e[`size.${i}.label`] = required;
    } else if (!size.volumeMl.trim()) {
      e[`size.${i}.volume`] = required;
    } else if (!Number.isInteger(Number(size.volumeMl)) || Number(size.volumeMl) <= 0) {
      e[`size.${i}.volume`] = "Whole number above 0";
    }

    if (!size.price.trim()) e[`size.${i}.price`] = required;
    else if (!(Number(size.price) >= 0)) e[`size.${i}.price`] = "Enter a valid price";

    if (size.onSale && !discountSummary(size.price, size.compareAtPrice)) {
      e[`size.${i}.compareAt`] = size.compareAtPrice.trim() ? "Must be higher than the price" : required;
    }

    // Optional, but a typo should not become a declared parcel weight: whole grams,
    // and nothing past what the server accepts.
    const weight = size.weightGrams.trim();
    if (weight && !(Number.isInteger(Number(weight)) && Number(weight) > 0 && Number(weight) <= 20000)) {
      e[`size.${i}.weight`] = "Whole grams, up to 20000";
    }

    // The server refuses a size with no photo, so it's as required as the rest.
    if (!size.image) e[`size.${i}.image`] = "Add a photo for this size.";
  });

  return e;
}

export function ProductForm({
  productId,
  initial,
  catalog = [],
}: {
  productId?: string;
  initial?: ProductFormInitial;
  /** products a set's items can link to */
  catalog?: CatalogEntry[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(
    initial ? fromInitial(initial) : emptyValues,
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Codes that can't be used, keyed by the code as typed (lower-cased). By text
  // rather than by row, so it stays right as sizes are added, removed or reordered,
  // and it clears itself the moment the admin edits the code.
  const [skuIssues, setSkuIssues] = useState<Record<string, SkuIssue>>({});
  // "… so SP-IMP-050-2 was picked instead", shown under a code the form swapped itself.
  const [skuNotes, setSkuNotes] = useState<Record<string, string>>({});

  // Nothing is flagged until the first Save attempt. After that the marks are
  // recomputed on every keystroke, so a field drops its red as soon as it's
  // filled — the admin can watch the list shrink to nothing.
  const [attempted, setAttempted] = useState(false);
  const errors = useMemo<FormErrors>(() => (attempted ? validate(values) : {}), [attempted, values]);
  const issueCount = Object.keys(errors).length;
  const sectionIssues = (...keys: string[]) =>
    Object.keys(errors).filter((k) => keys.some((p) => k === p || k.startsWith(`${p}.`))).length;
  /** value for aria-invalid: set only when the field has an error */
  const bad = (key: string) => (errors[key] ? true : undefined);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  // What is being added: a perfume, a gift set, or bakhoor. Bakhoor is stored as a
  // category, so choosing it sets that; choosing anything else takes it back to an
  // ordinary scent family (the form's default), rather than leaving a gift set or
  // a perfume carrying a "Bakhoor" category nobody can see or change.
  const kind = productKind({ category: values.category, isSet: values.isSet });

  function chooseKind(next: ProductKind) {
    setValues((v) => ({
      ...v,
      isSet: next === "set",
      category: next === "bakhoor" ? BAKHOOR_CATEGORY : v.category === BAKHOOR_CATEGORY ? "Fresh" : v.category,
    }));
  }

  function updateSize(index: number, patch: Partial<SizeForm>) {
    setValues((v) => ({
      ...v,
      sizes: v.sizes.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  }

  function updateSetItem(index: number, patch: Partial<SetItemForm>) {
    setValues((v) => ({
      ...v,
      setItems: v.setItems.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  // Picking a catalogue product fills in the name, since that's almost always
  // what the row should say; the admin can still edit it afterwards.
  function handleSetItemLink(index: number, productSlug: string) {
    const linked = catalog.find((p) => p.slug === productSlug);
    const item = values.setItems[index];
    updateSetItem(index, {
      productSlug,
      ...(linked && !item.name ? { name: linked.fullName } : {}),
    });
  }

  function handleNameChange(name: string) {
    setValues((v) => {
      const slugWasAuto = v.slug === "" || v.slug === slugify(v.name);
      const fullNameWasAuto = v.fullName === "" || v.fullName === `me. ${v.name}`;
      const slug = slugWasAuto ? slugify(name) : v.slug;
      return {
        ...v,
        name,
        slug,
        fullName: fullNameWasAuto ? (name ? `me. ${name}` : "") : v.fullName,
        sizes: followSlug(v.sizes, v.slug, slug, v.isSet),
      };
    });
  }

  function handleSlugChange(input: string) {
    setValues((v) => {
      const slug = slugify(input);
      return { ...v, slug, sizes: followSlug(v.sizes, v.slug, slug, v.isSet) };
    });
  }

  // The size number and its unit both feed the auto-suggested SKU, so changing
  // either re-suggests it — unless the admin has typed their own code.
  function handleVolumeChange(index: number, volumeMl: string) {
    const size = values.sizes[index];
    const skuWasAuto = isAutoSku(size.sku, values.slug, size.volumeMl, size.unit);
    updateSize(index, {
      volumeMl,
      ...(skuWasAuto ? { sku: suggestSku(values.slug, volumeMl, size.unit) } : {}),
    });
  }

  function handleUnitChange(index: number, unit: SizeUnit) {
    const size = values.sizes[index];
    const skuWasAuto = isAutoSku(size.sku, values.slug, size.volumeMl, size.unit);
    updateSize(index, {
      unit,
      ...(skuWasAuto ? { sku: suggestSku(values.slug, size.volumeMl, unit) } : {}),
    });
  }

  // What the server found out about the codes. A code this form suggested itself is
  // swapped for a free one on the spot (with a note saying so); a code the admin typed
  // is never changed behind their back — it is marked, and the free one is offered.
  const applyConflicts = useCallback((conflicts: SkuConflict[], auto: boolean[]) => {
    const swaps = new Map<number, SkuConflict>();
    const issues: Record<string, SkuIssue> = {};
    for (const c of conflicts) {
      if (auto[c.index]) swaps.set(c.index, c);
      else issues[c.sku.toLowerCase()] = { message: c.message, suggestion: c.suggestion };
    }
    setSkuIssues(issues);
    if (swaps.size === 0) return;

    setValues((v) => ({
      ...v,
      sizes: v.sizes.map((s, i) => {
        const c = swaps.get(i);
        const typed = s.sku.trim();
        return c && (typed === "" || typed === c.sku) ? { ...s, sku: c.suggestion } : s;
      }),
    }));
    setSkuNotes((n) => ({
      ...n,
      ...Object.fromEntries([...swaps.values()].map((c) => [c.suggestion.toLowerCase(), pickedNote(c)])),
    }));
  }, []);

  // A moment after the admin stops typing, ask whether the codes are free, so a taken
  // one is sorted out before Save rather than failing it. The codes are folded into one
  // string so this runs when a code changes, not on every keystroke elsewhere in the
  // form. A suggestion for a size with no number yet ("…-000") isn't a real code.
  const codeKey = JSON.stringify(
    values.sizes.map((s) => {
      const auto = !s.id && isAutoSku(s.sku, values.slug, s.volumeMl, s.unit);
      const placeholder = auto && !values.isSet && !s.volumeMl.trim();
      return [s.id ?? null, placeholder ? "" : s.sku.trim(), auto];
    }),
  );

  useEffect(() => {
    const rows = JSON.parse(codeKey) as [string | null, string, boolean][];
    if (rows.every(([, sku]) => sku === "")) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/product-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: rows.map(([sizeId, sku]) => ({ sku, sizeId: sizeId ?? undefined })),
          }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const { conflicts } = (await res.json()) as { conflicts: SkuConflict[] };
        if (!controller.signal.aborted) applyConflicts(conflicts, rows.map(([, , auto]) => auto));
      } catch {
        // Advisory only: saving checks again, and says so plainly.
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [codeKey, applyConflicts]);

  // Scroll to the first red field and put the cursor in it, so the admin doesn't
  // have to hunt through a long form. Runs a frame later, once the red marks
  // (and the Advanced section, if it had to open) have rendered.
  function focusFirstInvalid() {
    requestAnimationFrame(() => {
      const first = formRef.current?.querySelector<HTMLElement>(
        '[aria-invalid="true"], [data-invalid="true"]',
      );
      if (!first) return;
      first.scrollIntoView({ block: "center", behavior: "smooth" });
      first.focus({ preventScroll: true });
    });
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

  async function handleSizeImageUpload(index: number, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      updateSize(index, { image: url });
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const found = validate(values);
    if (Object.keys(found).length > 0) {
      setAttempted(true);
      // These two live under "Advanced settings"; open it or the red mark would
      // be on a field nobody can see.
      if (found.slug || found.fullName) setShowAdvanced(true);
      focusFirstInvalid();
      return;
    }

    const setItems = values.setItems
      .map((item) => ({
        name: item.name.trim(),
        size: item.size.trim(),
        productSlug: item.productSlug || undefined,
      }))
      .filter((item) => item.name || item.size);

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
      signature: values.signature,
      isNew: values.isNew,
      isSet: values.isSet,
      setItems: values.isSet ? setItems : [],
      sizes: values.sizes.map((s, i) => ({
        id: s.id,
        // A set's options have no single volume. volumeMl still has to be a
        // positive number (it orders the options), so it's the option's
        // position: the first one listed is the one the page opens on.
        label: values.isSet ? s.label.trim() : `${s.volumeMl} ${s.unit}`,
        volumeMl: values.isSet ? i + 1 : Number(s.volumeMl),
        sku: s.sku || (values.isSet ? suggestSku(values.slug, `SET${i + 1}`) : suggestSku(values.slug, s.volumeMl, s.unit)),
        price: Math.round(Number(s.price)),
        compareAtPrice: s.onSale && s.compareAtPrice ? Math.round(Number(s.compareAtPrice)) : undefined,
        // null (not undefined) when blank, so clearing the box clears the saved weight.
        weightGrams: s.weightGrams.trim() ? Math.round(Number(s.weightGrams)) : null,
        image: s.image,
        thumb: s.image,
      })),
    };

    // Which codes the form suggested itself, as opposed to ones the admin typed.
    const auto = values.sizes.map((s) => !s.id && isAutoSku(s.sku, values.slug, s.volumeMl, s.unit));

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
        const conflicts: SkuConflict[] | null = Array.isArray(body?.skuConflicts) ? body.skuConflicts : null;

        if (conflicts) {
          // Someone took a code after the live check, or it was never checked.
          applyConflicts(conflicts, auto);
          const needsAttention = conflicts.some((c) => !auto[c.index]);
          setError(
            needsAttention
              ? body.error
              : "A product code was already taken, so we switched to a free one. Check the new code in the Product code (SKU) box, then press Save again.",
          );
          if (needsAttention) focusFirstInvalid();
        } else {
          setError(typeof body?.error === "string" ? body.error : "Could not save product.");
        }
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
    // noValidate: the browser's own check stops at the first empty field with a
    // small tooltip. validate() runs instead so every empty field turns red.
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="max-w-6xl pb-28">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <SectionCard
            step="01"
            title="Basics"
            description="What the product is called and how it's grouped."
            issues={sectionIssues("name", "tagline", "slug", "fullName")}
          >
            <div>
              <span className="text-xs font-medium text-ink-soft">What are you adding?</span>
              <div className="mt-1.5 grid grid-cols-3 border border-line text-xs font-semibold uppercase tracking-[0.08em]">
                {(
                  [
                    ["perfume", "Single perfume"],
                    ["set", "Gift set"],
                    ["bakhoor", "Bakhoor"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={kind === value}
                    onClick={() => chooseKind(value)}
                    className={`min-h-11 px-2 transition-colors sm:px-3 ${
                      kind === value ? "bg-ink text-paper" : "hover:bg-paper-2"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {kind === "set" && (
                <p className="mt-2 text-xs text-ink-soft">
                  Several items sold together at one price. You&apos;ll list what&apos;s inside the box under Story.
                </p>
              )}
              {kind === "bakhoor" && (
                <p className="mt-2 text-xs text-ink-soft">
                  Bakhoor and other incense. It shows under the Bakhoor tab in the shop. It is sold by weight, so
                  pick gm, kg or tola next to each size.
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Product name" className="sm:col-span-2" error={errors.name}>
                <Input
                  required
                  aria-invalid={bad("name")}
                  value={values.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Imperial"
                />
              </Field>
              <Field label="Tagline" className="sm:col-span-2" error={errors.tagline}>
                <Input
                  required
                  aria-invalid={bad("tagline")}
                  value={values.tagline}
                  onChange={(e) => update("tagline", e.target.value)}
                  placeholder="A short line shown under the name, e.g. Amber gold, worn like a crown."
                />
              </Field>
              {/* A set has no single scent family or concentration; the
                  storefront labels it "Gift Set" wherever these would show.
                  Bakhoor has neither either, and is chosen above rather than here. */}
              {kind === "perfume" && (
              <>
              <Field label="Category">
                <select
                  required
                  value={values.category}
                  onChange={(e) => update("category", e.target.value as ProductFormValues["category"])}
                  className="mt-1.5 min-h-11 w-full border border-line bg-transparent px-3.5 py-2.5 text-base outline-none transition-colors focus:border-ink sm:text-sm"
                >
                  {CATEGORIES.filter((c) => c !== BAKHOOR_CATEGORY).map((c) => (
                    <option key={c} value={c}>
                      {categoryLabel(c)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Concentration">
                <select
                  required
                  value={values.concentration}
                  onChange={(e) => update("concentration", e.target.value)}
                  className="mt-1.5 min-h-11 w-full border border-line bg-transparent px-3.5 py-2.5 text-base outline-none transition-colors focus:border-ink sm:text-sm"
                >
                  {CONCENTRATIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              </>
              )}
              <Field label="Brand color" className="sm:col-span-2">
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(values.accent) ? values.accent : "#131110"}
                    onChange={(e) => update("accent", e.target.value)}
                    className="h-11 w-14 cursor-pointer border border-line p-0.5"
                  />
                  <p className="text-xs text-ink-soft">
                    Click the swatch to pick a color. Used for small accents around the site.
                  </p>
                </div>
              </Field>
            </div>
            {/* These three decide where a scent shows up outside its own page:
                Bestseller drives the homepage row and the shop's Best Sellers
                filter, Signature the shop's Signature Collection filter. */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 text-sm">
              <label className="flex min-h-11 cursor-pointer items-center gap-2.5 md:min-h-0">
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 accent-[var(--color-ink)]"
                  checked={values.bestseller}
                  onChange={(e) => update("bestseller", e.target.checked)}
                />
                Bestseller
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-2.5 md:min-h-0">
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 accent-[var(--color-ink)]"
                  checked={values.signature}
                  onChange={(e) => update("signature", e.target.checked)}
                />
                Signature Collection
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-2.5 md:min-h-0">
                <input
                  type="checkbox"
                  className="h-5 w-5 shrink-0 accent-[var(--color-ink)]"
                  checked={values.isNew}
                  onChange={(e) => update("isNew", e.target.checked)}
                />
                New
              </label>
            </div>
            <div className="border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft hover:text-ink md:min-h-0"
              >
                {showAdvanced ? "Hide advanced settings" : "+ Advanced settings"}
              </button>
              {showAdvanced && (
                <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Web address" error={errors.slug}>
                    <Input
                      aria-invalid={bad("slug")}
                      value={values.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="imperial"
                    />
                  </Field>
                  <Field label="Product page title" error={errors.fullName}>
                    <Input
                      required
                      aria-invalid={bad("fullName")}
                      value={values.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                    />
                  </Field>
                  <p className="text-xs text-ink-soft sm:col-span-2">
                    We fill these in automatically from the product name. Only change them if you need something different.
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            step="03"
            title="Gallery Photos"
            description="Shown on the shop grid and product page."
            issues={sectionIssues("images")}
          >
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
            <div
              data-invalid={errors.images ? "true" : undefined}
              className={errors.images ? "border border-dashed border-red-600 bg-red-50/50 p-3" : undefined}
            >
              <UploadButton label="+ Add Photos" multiple onFiles={handleGalleryUpload} />
              {errors.images && <p className="mt-2 text-xs font-medium text-red-700">{errors.images}</p>}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            step="02"
            title="Story"
            description="The copy shown on the product page."
            issues={sectionIssues("description", "story", "setItem")}
          >
            <Field label="Description" error={errors.description}>
              <Textarea
                required
                aria-invalid={bad("description")}
                rows={4}
                value={values.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="A short paragraph describing the scent."
              />
            </Field>
            <Field label="Story" error={errors.story}>
              <Textarea
                required
                aria-invalid={bad("story")}
                rows={4}
                value={values.story}
                onChange={(e) => update("story", e.target.value)}
                placeholder="The longer story behind this scent."
              />
            </Field>
            {values.isSet ? (
              <div className="border-t border-line pt-5">
                <p className="text-sm font-semibold">What&apos;s inside the set</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  One row per item in the box, in the order you want them shown. Link an item to a
                  product you already sell and the set&apos;s page will link to it.
                </p>
                <div className="mt-4 space-y-3">
                  {values.setItems.map((item, i) => (
                    <div key={i} className="grid grid-cols-1 gap-3 border border-line p-3 sm:grid-cols-[1fr_7rem]">
                      <Field label={`Item ${i + 1}`} error={errors[`setItem.${i}.name`]}>
                        <Input
                          aria-invalid={bad(`setItem.${i}.name`)}
                          value={item.name}
                          onChange={(e) => updateSetItem(i, { name: e.target.value })}
                          placeholder="me. Kiano"
                        />
                      </Field>
                      <Field label="Size" error={errors[`setItem.${i}.size`]}>
                        <Input
                          aria-invalid={bad(`setItem.${i}.size`)}
                          value={item.size}
                          onChange={(e) => updateSetItem(i, { size: e.target.value })}
                          placeholder="50 ml"
                        />
                      </Field>
                      <div className="flex items-end gap-3 sm:col-span-2">
                        <Field label="Links to (optional)" className="flex-1">
                          <select
                            value={item.productSlug}
                            onChange={(e) => handleSetItemLink(i, e.target.value)}
                            className="mt-1.5 min-h-11 w-full border border-line bg-transparent px-3.5 py-2.5 text-base outline-none transition-colors focus:border-ink sm:text-sm"
                          >
                            <option value="">Not sold separately</option>
                            {catalog.map((p) => (
                              <option key={p.slug} value={p.slug}>
                                {p.fullName}
                              </option>
                            ))}
                          </select>
                        </Field>
                        {values.setItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => update("setItems", values.setItems.filter((_, idx) => idx !== i))}
                            className="inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.08em] text-red-700 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => update("setItems", [...values.setItems, emptySetItem])}
                  className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.08em] hover:text-gold-ink md:min-h-0"
                >
                  + Add another item
                </button>
              </div>
            ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Field label="Top notes">
                <Textarea
                  rows={4}
                  value={values.notesTop}
                  onChange={(e) => update("notesTop", e.target.value)}
                  placeholder={"One per line, e.g.\nBergamot\nPink Pepper"}
                />
                <p className="mt-1 text-xs text-ink-soft">What you smell first — fades within minutes.</p>
              </Field>
              <Field label="Heart notes">
                <Textarea
                  rows={4}
                  value={values.notesHeart}
                  onChange={(e) => update("notesHeart", e.target.value)}
                  placeholder={"One per line, e.g.\nRose\nAmber"}
                />
                <p className="mt-1 text-xs text-ink-soft">The main scent — lasts a few hours.</p>
              </Field>
              <Field label="Base notes">
                <Textarea
                  rows={4}
                  value={values.notesBase}
                  onChange={(e) => update("notesBase", e.target.value)}
                  placeholder={"One per line, e.g.\nOud\nMusk"}
                />
                <p className="mt-1 text-xs text-ink-soft">The lingering finish — lasts the longest.</p>
              </Field>
            </div>
            )}
          </SectionCard>

          <SectionCard
            step="04"
            title={values.isSet ? "Price & Discounts" : "Sizes, Prices & Discounts"}
            description={
              values.isSet
                ? "Usually one option. Add more only if you sell the set in more than one version."
                : "At least one size is required. Pick ml or L for liquids, gm, kg or tola for solids and attars."
            }
            issues={sectionIssues("size")}
          >
            <div className="space-y-5">
              {values.sizes.map((size, i) => {
                const summary = size.onSale ? discountSummary(size.price, size.compareAtPrice) : null;
                const skuKey = size.sku.trim().toLowerCase();
                const skuIssue = skuIssues[skuKey];
                return (
                  <div key={i} className="border border-line">
                    <div className="flex items-center justify-between border-b border-line bg-paper-2 px-4 py-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
                        {values.isSet ? `Option ${i + 1}` : `Size ${i + 1}`}
                      </span>
                      {values.sizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => update("sizes", values.sizes.filter((_, idx) => idx !== i))}
                          className="inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.08em] text-red-700 hover:underline md:min-h-0"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {values.isSet ? (
                          <Field label="Option name" error={errors[`size.${i}.label`]}>
                            <Input
                              required
                              aria-invalid={bad(`size.${i}.label`)}
                              value={size.label}
                              onChange={(e) => updateSize(i, { label: e.target.value })}
                              placeholder="Gift Box"
                            />
                          </Field>
                        ) : (
                          <Field label="Size" error={errors[`size.${i}.volume`]}>
                            <div className="flex gap-2">
                              <Input
                                required
                                type="number"
                                min={1}
                                className="min-w-0 flex-1"
                                aria-invalid={bad(`size.${i}.volume`)}
                                value={size.volumeMl}
                                onChange={(e) => handleVolumeChange(i, e.target.value)}
                                placeholder="30"
                              />
                              <select
                                aria-label="Unit"
                                value={size.unit}
                                onChange={(e) => handleUnitChange(i, e.target.value as SizeUnit)}
                                className="mt-1.5 min-h-11 w-[5.5rem] shrink-0 border border-line bg-transparent px-2.5 py-2.5 text-base outline-none transition-colors focus:border-ink sm:text-sm"
                              >
                                {SIZE_UNITS.map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </Field>
                        )}
                        <Field label="Price (₹) — what customers pay" error={errors[`size.${i}.price`]}>
                          <Input
                            required
                            type="number"
                            aria-invalid={bad(`size.${i}.price`)}
                            value={size.price}
                            onChange={(e) => updateSize(i, { price: e.target.value })}
                          />
                        </Field>
                      </div>

                      <div className="mt-4 border-t border-line pt-4">
                        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm md:min-h-0">
                          <input
                            type="checkbox"
                            className="h-5 w-5 shrink-0 accent-[var(--color-ink)]"
                            checked={size.onSale}
                            onChange={(e) =>
                              updateSize(i, {
                                onSale: e.target.checked,
                                compareAtPrice: e.target.checked ? size.compareAtPrice : "",
                              })
                            }
                          />
                          {values.isSet
                            ? "This set is on sale (apply a discount)"
                            : "This size is on sale (apply a discount)"}
                        </label>
                        {size.onSale && (
                          <div className="mt-3">
                            <Field
                              label="MRP (₹) — the higher price, shown crossed out"
                              error={errors[`size.${i}.compareAt`]}
                            >
                              <Input
                                type="number"
                                aria-invalid={bad(`size.${i}.compareAt`)}
                                value={size.compareAtPrice}
                                onChange={(e) => updateSize(i, { compareAtPrice: e.target.value })}
                                placeholder="e.g. 2999"
                              />
                            </Field>
                            <p className={`mt-2 text-xs ${summary ? "text-gold-ink" : "text-ink-soft"}`}>
                              {summary ??
                                (size.price
                                  ? `MRP must be higher than the price above (₹${size.price}). This is the price customers actually pay.`
                                  : "MRP must be higher than the price above — that's the price customers actually pay.")}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 border-t border-line pt-4">
                        <span
                          className={`text-xs font-medium ${errors[`size.${i}.image`] ? "text-red-700" : "text-ink-soft"}`}
                        >
                          Size photo
                        </span>
                        <div
                          data-invalid={errors[`size.${i}.image`] ? "true" : undefined}
                          className={`mt-1.5 flex items-center gap-3 ${
                            errors[`size.${i}.image`] ? "border border-dashed border-red-600 bg-red-50/50 p-3" : ""
                          }`}
                        >
                          {size.image && (
                            <div className="relative h-16 w-14 overflow-hidden border border-line">
                              <Image src={size.image} alt="" fill sizes="56px" className="object-cover" />
                            </div>
                          )}
                          <UploadButton
                            label={size.image ? "Replace" : "Upload"}
                            onFiles={(files) => handleSizeImageUpload(i, files)}
                          />
                          {errors[`size.${i}.image`] && (
                            <p className="text-xs font-medium text-red-700">{errors[`size.${i}.image`]}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 border-t border-line pt-4 sm:grid-cols-2">
                        <div>
                          <Field label="Product code (SKU)" error={skuIssue?.message}>
                            <Input
                              aria-invalid={skuIssue ? true : undefined}
                              value={size.sku}
                              onChange={(e) => updateSize(i, { sku: e.target.value })}
                            />
                          </Field>
                          {skuIssue ? (
                            <button
                              type="button"
                              onClick={() => updateSize(i, { sku: skuIssue.suggestion })}
                              className="mt-1.5 inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.06em] hover:text-gold-ink md:min-h-0"
                            >
                              Use {skuIssue.suggestion}
                            </button>
                          ) : (
                            <p className="mt-1.5 text-xs text-ink-soft">
                              {skuNotes[skuKey] ??
                                "We fill this in automatically — only change it if you already use your own codes."}
                            </p>
                          )}
                        </div>

                        <div>
                          <Field
                            label={values.isSet ? "Weight of the boxed set (grams)" : "Weight with box (grams)"}
                            error={errors[`size.${i}.weight`]}
                          >
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              step={1}
                              placeholder="e.g. 225"
                              aria-invalid={bad(`size.${i}.weight`)}
                              value={size.weightGrams}
                              onChange={(e) => updateSize(i, { weightGrams: e.target.value })}
                            />
                          </Field>
                          <p className="mt-1.5 text-xs text-ink-soft">
                            Put the sealed box on a scale. Optional — packing weight is added when it ships, and
                            India Post bills by weight.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() =>
                update("sizes", [
                  ...values.sizes,
                  // A set's SKU is filled on save from its position (…-SET2).
                  { ...emptySize, sku: values.isSet ? "" : suggestSku(values.slug, "") },
                ])
              }
              className="inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.08em] hover:text-gold-ink md:min-h-0"
            >
              {values.isSet ? "+ Add another option" : "+ Add another size"}
            </button>
          </SectionCard>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/97">
        <div className="container-grid flex items-center justify-between gap-4 py-4">
          {error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : issueCount > 0 ? (
            <p className="text-sm font-medium text-red-700">
              {issueCount === 1
                ? "1 field still needs attention"
                : `${issueCount} fields still need attention`}{" "}
              — marked in red above.
            </p>
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
