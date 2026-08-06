"use client";

import { useState, type FormEvent } from "react";
import { Reveal } from "@/components/motion/Reveal";

export function NewsletterBand() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section className="border-t border-line bg-paper-2">
      <div className="container-grid grid grid-cols-1 items-center gap-8 py-14 sm:py-20 md:grid-cols-12 md:py-28">
        <Reveal className="md:col-span-6">
          <h2 className="text-3xl font-black tracking-tight md:text-5xl">
            First on the list,
            <br />
            first on new scents.
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="md:col-span-5 md:col-start-8">
          {submitted ? (
            <p className="text-sm font-semibold">
              You&rsquo;re on the list — thank you.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex items-center border-b border-ink pb-2"
            >
              <input
                type="email"
                required
                placeholder="Email address"
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
              />
              <button
                type="submit"
                className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] hover:text-gold-ink"
              >
                Notify Me →
              </button>
            </form>
          )}
          <p className="mt-3 text-xs text-ink-soft">
            No spam. Just new launches and restock alerts.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
