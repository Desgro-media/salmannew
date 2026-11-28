"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { PolicyBody } from "@/components/policies/PolicyBody";
import type { PolicyText } from "@/lib/policies/defaults";
import { MAX_POLICY_BODY, MAX_POLICY_SUMMARY, type PolicySlug } from "@/lib/policies/pages";
import {
  fillPlaceholders,
  PLACEHOLDERS,
  unknownPlaceholders,
  type PlaceholderValues,
} from "@/lib/policies/placeholders";

export function PolicyEditor({
  slug,
  saved,
  fallback,
  isDefault,
  values,
}: {
  slug: PolicySlug;
  /** what customers see now */
  saved: PolicyText;
  /** the default text, for "Restore default text" */
  fallback: PolicyText;
  isDefault: boolean;
  /** what each {{tag}} currently stands for, worked out on the server */
  values: PlaceholderValues;
}) {
  const router = useRouter();
  const [body, setBody] = useState(saved.body);
  const [summary, setSummary] = useState(saved.summary ?? "");
  // What is on the website, so "unsaved changes" stays right after a save.
  const [live, setLive] = useState({ body: saved.body, summary: saved.summary ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "restore" | null>(null);

  const hasSummary = slug === "returns";
  const dirty = body !== live.body || (hasSummary && summary !== live.summary);
  const unknown = unknownPlaceholders(body);
  const valid = body.trim() !== "" && unknown.length === 0 && (!hasSummary || summary.trim() !== "");

  // A long edit should not vanish because a tab was closed or reloaded.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function send(method: "PUT" | "DELETE") {
    const res = await fetch(`/api/admin/policies/${slug}`, {
      method,
      ...(method === "PUT" && {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, ...(hasSummary && { summary }) }),
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(typeof data?.error === "string" ? data.error : "Could not save this policy.");
    }
    return data;
  }

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy("save");
    try {
      const data = await send("PUT");
      const next = { body: data.body as string, summary: (data.summary as string | null) ?? "" };
      setBody(next.body);
      setSummary(next.summary);
      setLive(next);
      setNotice("Saved. The website now shows this text.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore() {
    if (!window.confirm("Replace the text on the website with the default? Your saved changes to this policy will be deleted.")) {
      return;
    }
    setError(null);
    setNotice(null);
    setBusy("restore");
    try {
      await send("DELETE");
      const next = { body: fallback.body, summary: fallback.summary ?? "" };
      setBody(next.body);
      setSummary(next.summary);
      setLive(next);
      setNotice("Restored. The website now shows the default text.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <form onSubmit={handleSave}>
      {hasSummary && (
        <div className="mb-8 max-w-3xl">
          <Field label="Short line shown on every product page, under “Shipping & Returns”">
            <Input
              required
              maxLength={MAX_POLICY_SUMMARY}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </Field>
          <p className="mt-2 text-xs text-ink-soft">
            If you change a return rule below, change this line to match.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
        <div>
          <Field label="Policy text">
            {/* data-lenis-prevent: the site's smooth scrolling would otherwise
                take the wheel and scroll the page instead of this box. */}
            <Textarea
              required
              data-lenis-prevent
              maxLength={MAX_POLICY_BODY}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="h-[60vh] min-h-80 resize-y leading-relaxed"
            />
          </Field>

          <details className="mt-4 border border-line p-4 text-sm">
            <summary className="cursor-pointer font-semibold">How to format the text</summary>
            <ul className="mt-3 space-y-1.5 text-ink-soft">
              <li><code className="text-ink">## Heading</code> starts a section</li>
              <li><code className="text-ink">- item</code> makes a bulleted list</li>
              <li><code className="text-ink">**words**</code> makes them bold</li>
              <li><code className="text-ink">[Contact us](/contact)</code> makes a link</li>
              <li>Leave an empty line to start a new paragraph</li>
            </ul>
          </details>

          <details className="mt-3 border border-line p-4 text-sm">
            <summary className="cursor-pointer font-semibold">Tags that fill themselves in</summary>
            <p className="mt-3 text-ink-soft">
              Type a tag instead of the figure, and it stays correct when the figure changes.
            </p>
            <dl className="mt-3 space-y-3">
              {PLACEHOLDERS.map((tag) => (
                <div key={tag.key}>
                  <dt><code>{`{{${tag.key}}}`}</code></dt>
                  <dd className="text-ink-soft">
                    {tag.source}. Now: <span className="text-ink">{values[tag.key]}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        </div>

        <div>
          <span className="text-xs font-medium text-ink-soft">Preview</span>
          <div data-lenis-prevent className="mt-1.5 h-[60vh] min-h-80 overflow-y-auto overscroll-contain border border-line p-5">
            <PolicyBody text={fillPlaceholders(body, values)} />
          </div>
          <p className="mt-2 text-xs text-ink-soft">Links in the preview open that page and leave the editor.</p>
        </div>
      </div>

      <div className="mt-6">
        {unknown.length > 0 && (
          <p className="mb-3 text-sm text-red-700">
            Not a tag the shop knows: {unknown.join(", ")}. Fix or remove it to save.
          </p>
        )}
        {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
        {notice && !dirty && <p role="status" className="mb-3 text-sm text-ink-soft">{notice}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy !== null || !dirty || !valid}>
            {busy === "save" ? "Saving…" : "Save Changes"}
          </Button>
          {(!isDefault || dirty) && (
            <Button
              type="button"
              variant="secondary"
              disabled={busy !== null}
              onClick={
                isDefault
                  ? () => {
                      setBody(live.body);
                      setSummary(live.summary);
                      setError(null);
                    }
                  : handleRestore
              }
            >
              {isDefault ? "Undo Changes" : busy === "restore" ? "Restoring…" : "Restore Default Text"}
            </Button>
          )}
          {dirty && <span className="text-xs text-ink-soft">You have unsaved changes.</span>}
        </div>
      </div>
    </form>
  );
}
