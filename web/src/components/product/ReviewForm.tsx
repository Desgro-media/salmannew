"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useAccountSession } from "@/lib/use-account-session";
import { MAX_REVIEW_PHOTOS } from "@/lib/review-schema";

interface OwnReview {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  photos: string[];
  isHidden: boolean;
}

export function ReviewForm({ productId }: { productId: string }) {
  const account = useAccountSession();
  const router = useRouter();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [own, setOwn] = useState<OwnReview | null | undefined>(undefined);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  // Only fetch once we know there is a session. Logged-out visitors need no
  // state change here — the sign-in prompt renders before `own` is ever read.
  useEffect(() => {
    if (!account) return;

    let cancelled = false;
    fetch(`/api/reviews/mine?productId=${encodeURIComponent(productId)}`)
      .then((res) => res.json())
      .then((data: OwnReview | null) => {
        if (cancelled) return;
        setOwn(data);
        if (data) {
          setRating(data.rating);
          setTitle(data.title ?? "");
          setBody(data.body);
          setPhotos(data.photos);
        }
      })
      .catch(() => {
        if (!cancelled) setOwn(null);
      });

    return () => {
      cancelled = true;
    };
  }, [account, productId]);

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    // Reset immediately so picking the same file twice still fires onChange.
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;

    const room = MAX_REVIEW_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`You can attach up to ${MAX_REVIEW_PHOTOS} photos.`);
      return;
    }

    setError(null);
    setUploading(true);

    for (const file of files.slice(0, room)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/reviews/photos", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "That photo could not be uploaded.");
          break;
        }
        setPhotos((current) => [...current, data.url]);
      } catch {
        setError("That photo could not be uploaded.");
        break;
      }
    }

    setUploading(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      setError("Pick a star rating first.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim(),
          body,
          photos,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Your review could not be saved.");
        setSubmitting(false);
        return;
      }

      setSaved(true);
      setOwn({
        id: data.id,
        rating,
        title: title.trim() || null,
        body,
        photos,
        isHidden: false,
      });
      router.refresh();
    } catch {
      setError("Your review could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!own) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${own.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Your review could not be removed.");
        setSubmitting(false);
        return;
      }
      setOwn(null);
      setRating(0);
      setTitle("");
      setBody("");
      setPhotos([]);
      setSaved(false);
      // Nothing left to edit, so fold back to the button rather than leaving an
      // empty form sitting open.
      setOpen(false);
      router.refresh();
    } catch {
      setError("Your review could not be removed.");
    } finally {
      setSubmitting(false);
    }
  }

  // Closed by default: the form is the tallest thing in this section and most
  // visitors are here to read reviews, not leave one. Collapsed it costs a
  // single button, and the reviews below start near the top of the section.
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition-colors duration-300 hover:bg-gold hover:text-ink"
      >
        {own ? "Edit Your Review" : "Write a Review"}
      </button>
    );
  }

  if (account === undefined) {
    return (
      <div
        className="h-32 rounded-[22px] border border-line bg-paper-2"
        aria-hidden
      />
    );
  }

  if (account === null) {
    return (
      <div className="rounded-[22px] border border-line bg-paper-2 p-6 text-center sm:p-8">
        <p className="text-sm font-semibold">Sign in to write a review</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
          Reviews are tied to an account so people can tell real ones from
          noise.
        </p>
        <Link
          // The account pages read `redirect`, not `next` — see account/login.
          href={`/account/login?redirect=${encodeURIComponent(pathname)}`}
          className="mt-5 inline-flex items-center justify-center bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition-colors duration-300 hover:bg-gold hover:text-ink"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const activeRating = hoverRating || rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[22px] border border-line bg-paper-2 p-6 sm:p-8"
    >
      <p className="eyebrow text-ink-soft">
        {own ? "Your review" : "Write a review"}
      </p>

      {own?.isHidden && (
        <p className="mt-3 rounded-lg bg-paper-3 px-3 py-2 text-xs text-ink-soft">
          This review is currently hidden by the shop, so it isn&rsquo;t shown
          on the storefront. Editing it won&rsquo;t restore it.
        </p>
      )}

      {/* Two rows of two rather than one column of four. Rating pairs with the
          headline because both are a single line tall, and the photo tray sits
          beside the textarea because it is the only other field that needs
          height. Collapses back to a stack below sm, where side-by-side would
          leave each field too narrow to use. */}
      <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-12">
        <fieldset className="sm:col-span-4">
          <legend className="text-xs font-medium text-ink-soft">Rating</legend>
          <div
            className="mt-2 flex items-center gap-1"
            onMouseLeave={() => setHoverRating(0)}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onFocus={() => setHoverRating(value)}
                onBlur={() => setHoverRating(0)}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                aria-pressed={rating === value}
                className="p-0.5"
              >
                <svg
                  viewBox="0 0 20 20"
                  className={clsx(
                    "h-7 w-7 transition-colors duration-200",
                    value <= activeRating ? "fill-gold-deep" : "fill-line",
                  )}
                  aria-hidden
                >
                  <path d="M10 1.6l2.47 5.006 5.525.803-3.998 3.897.944 5.503L10 14.209l-4.941 2.6.944-5.503L2.005 7.409l5.525-.803z" />
                </svg>
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block sm:col-span-8">
          <span className="text-xs font-medium text-ink-soft">
            Headline (optional)
          </span>
          <input
            type="text"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sums it up in a few words"
            className="mt-1.5 w-full border border-line bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ink"
          />
        </label>

        <label className="block sm:col-span-8">
          <span className="text-xs font-medium text-ink-soft">Your review</span>
          <textarea
            required
            value={body}
            rows={4}
            minLength={10}
            maxLength={2000}
            onChange={(e) => setBody(e.target.value)}
            placeholder="How does it wear through the day? How long does it last?"
            className="mt-1.5 w-full resize-y border border-line bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ink"
          />
          <span className="mt-1 block text-right text-[11px] text-ink-soft">
            {body.trim().length}/2000
          </span>
        </label>

        <div className="sm:col-span-4">
          <span className="text-xs font-medium text-ink-soft">
            Photos (optional, up to {MAX_REVIEW_PHOTOS})
          </span>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {photos.map((photo, i) => (
              <span
                key={photo}
                className="relative h-16 w-16 overflow-hidden rounded-xl border border-line bg-paper-3"
              >
                <Image
                  src={photo}
                  alt={`Attached photo ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotos((c) => c.filter((p) => p !== photo))}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/80 text-[11px] leading-none text-paper"
                >
                  &times;
                </button>
              </span>
            ))}

            {photos.length < MAX_REVIEW_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-line text-xl text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
                aria-label="Add a photo"
              >
                {uploading ? "…" : "+"}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {saved && !error && (
        <p className="mt-4 text-sm font-semibold">
          Thanks — your review is live.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition-colors duration-300 hover:bg-gold hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          {submitting ? "Saving…" : own ? "Update Review" : "Post Review"}
        </button>

        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={submitting}
          className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline disabled:opacity-40"
        >
          {saved ? "Close" : "Cancel"}
        </button>

        {own && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline disabled:opacity-40"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
