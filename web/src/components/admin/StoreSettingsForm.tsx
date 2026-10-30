"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { formatPrice } from "@/lib/format";
import { calculateShipping, type ShippingSettings } from "@/lib/shipping";
import type { CodSettings } from "@/lib/cod";

export function StoreSettingsForm({ settings }: { settings: ShippingSettings & CodSettings }) {
  const router = useRouter();
  // Kept as strings so the fields can be cleared while typing. A number state
  // would coerce an empty box to 0 and silently offer free delivery.
  const [shippingFee, setShippingFee] = useState(String(settings.shippingFee));
  const [threshold, setThreshold] = useState(String(settings.freeShippingThreshold));
  const [codEnabled, setCodEnabled] = useState(settings.codEnabled);
  const [codFee, setCodFee] = useState(String(settings.codFee));
  const [codMax, setCodMax] = useState(String(settings.codMaxOrderValue));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const feeValue = Number(shippingFee);
  const thresholdValue = Number(threshold);
  const codFeeValue = Number(codFee);
  const codMaxValue = Number(codMax);
  const isWholeRupees = (raw: string, value: number) =>
    raw !== "" && Number.isInteger(value) && value >= 0;
  const valid =
    isWholeRupees(shippingFee, feeValue) &&
    isWholeRupees(threshold, thresholdValue) &&
    isWholeRupees(codFee, codFeeValue) &&
    isWholeRupees(codMax, codMaxValue);

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
          codEnabled,
          codFee: codFeeValue,
          codMaxOrderValue: codMaxValue,
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
      {isWholeRupees(shippingFee, feeValue) && isWholeRupees(threshold, thresholdValue) && (
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

      <div className="mt-10 border-t border-line pt-8">
        <p className="eyebrow text-ink-soft">Cash on Delivery</p>

        <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-2.5 text-sm md:min-h-0">
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0 accent-[var(--color-ink)]"
            checked={codEnabled}
            onChange={(e) => setCodEnabled(e.target.checked)}
          />
          Offer cash on delivery at checkout
        </label>

        {/* Stays in the page while off, just inert, so switching COD back on
            finds the figures where they were left instead of blank. */}
        <div
          className={`mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 ${codEnabled ? "" : "opacity-50"}`}
        >
          <Field label="Cash on delivery fee (₹)">
            <Input
              required
              type="number"
              min={0}
              step={1}
              disabled={!codEnabled}
              value={codFee}
              onChange={(e) => setCodFee(e.target.value)}
            />
          </Field>
          <Field label="Largest order for cash on delivery (₹)">
            <Input
              required
              type="number"
              min={0}
              step={1}
              disabled={!codEnabled}
              value={codMax}
              onChange={(e) => setCodMax(e.target.value)}
            />
          </Field>
        </div>

        {isWholeRupees(codFee, codFeeValue) && isWholeRupees(codMax, codMaxValue) && (
          <p className="mt-4 text-sm text-ink-soft">
            {codEnabled ? (
              <>
                Customers can choose cash on delivery{" "}
                <strong className="text-ink">
                  {codMaxValue === 0
                    ? "on any order"
                    : `on orders up to ${formatPrice(codMaxValue)}`}
                </strong>
                ,{" "}
                {codFeeValue === 0
                  ? "with no extra charge."
                  : `with an extra ${formatPrice(codFeeValue)} added to the total.`}{" "}
                Enter 0 as the largest order to remove the limit.
              </>
            ) : (
              "Cash on delivery is switched off — checkout only offers online payment."
            )}
          </p>
        )}
      </div>

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
