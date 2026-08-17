"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { formatPrice } from "@/lib/format";
import { calculateShipping, type ShippingSettings } from "@/lib/shipping";

export function StoreSettingsForm({ settings }: { settings: ShippingSettings }) {
  const router = useRouter();
  // Kept as strings so the fields can be cleared while typing. A number state
  // would coerce an empty box to 0 and silently offer free delivery.
  const [shippingFee, setShippingFee] = useState(String(settings.shippingFee));
  const [threshold, setThreshold] = useState(String(settings.freeShippingThreshold));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const feeValue = Number(shippingFee);
  const thresholdValue = Number(threshold);
  const valid =
    shippingFee !== "" &&
    threshold !== "" &&
    Number.isInteger(feeValue) &&
    Number.isInteger(thresholdValue) &&
    feeValue >= 0 &&
    thresholdValue >= 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingFee: feeValue,
          freeShippingThreshold: thresholdValue,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(typeof body?.error === "string" ? body.error : "Could not save these settings.");
        return;
      }
      setSaved(true);
      // Pulls the server components on this page back in sync with what was
      // just written, so a reload is never needed to see the saved values.
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Delivery charge (₹)">
          <Input
            required
            type="number"
            min={0}
            step={1}
            value={shippingFee}
            onChange={(e) => setShippingFee(e.target.value)}
          />
        </Field>
        <Field label="Free delivery above (₹)">
          <Input
            required
            type="number"
            min={0}
            step={1}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </Field>
      </div>

      {/* Spells the rule back out in plain language. Two numbers on their own
          are easy to enter the wrong way round, and this makes that obvious
          before saving rather than after a customer is charged. */}
      {valid && (
        <p className="mt-4 text-sm text-ink-soft">
          Orders under {formatPrice(thresholdValue)} pay{" "}
          <strong className="text-ink">
            {feeValue === 0
              ? "nothing"
              : formatPrice(calculateShipping(1, { shippingFee: feeValue, freeShippingThreshold: thresholdValue }))}
          </strong>{" "}
          for delivery. At {formatPrice(thresholdValue)} and above, delivery is free.
        </p>
      )}

      <div className="mt-6">
        {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
        {saved && !error && (
          <p className="mb-3 text-sm text-ink-soft">
            Saved. The storefront and checkout now use these figures.
          </p>
        )}
        <Button type="submit" disabled={submitting || !valid}>
          {submitting ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
