import type { Metadata } from "next";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import {
  LOCATION_NAME,
  LOCATION_ADDRESS,
  LOCATION_MAPS_DIRECTIONS_URL,
  LOCATION_MAPS_EMBED_URL,
} from "@/lib/contact-info";

export const metadata: Metadata = {
  title: "Contact — Salman Perfumes",
  description: "Get in touch with Salman Perfumes.",
};

const CHANNELS = [
  {
    label: "Email",
    value: "hello@salmanperfumes.com",
    href: "mailto:hello@salmanperfumes.com",
  },
  {
    label: "Phone",
    value: "+91 98765 43210",
    href: "tel:+919876543210",
  },
  {
    label: "Instagram",
    value: "@salman.perfumes_",
    href: "https://www.instagram.com/salman.perfumes_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
  },
];

export default function ContactPage() {
  return (
    <div className="pt-16 md:pt-20">
      <section className="container-grid border-b border-line py-20 md:py-32">
        <Reveal>
          <p className="eyebrow text-ink-soft">Contact</p>
          <h1 className="mt-4 max-w-2xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
            Let&rsquo;s talk scent.
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-ink-soft">
            Questions about an order, a scent, or a bulk/gifting request —
            reach us directly and we&rsquo;ll get back to you within a day.
          </p>
        </Reveal>
      </section>

      <section className="container-grid py-20 md:py-28">
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-3">
          {CHANNELS.map((channel, i) => (
            <Reveal key={channel.label} delay={i * 0.08}>
              <p className="eyebrow text-ink-soft">{channel.label}</p>
              <a
                href={channel.href}
                target={channel.href.startsWith("http") ? "_blank" : undefined}
                rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="mt-3 inline-block text-2xl font-semibold tracking-tight hover:text-gold-ink md:text-3xl"
              >
                {channel.value}
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15} className="mt-16">
          <ButtonLink href="/shop">Shop the Collection</ButtonLink>
        </Reveal>
      </section>

      <section className="container-grid border-t border-line py-20 md:py-28">
        <Reveal>
          <p className="eyebrow text-ink-soft">Located In</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            {LOCATION_NAME}
          </h2>
          <p className="mt-4 max-w-lg leading-relaxed text-ink-soft">
            {LOCATION_ADDRESS}
          </p>
          <a
            href={LOCATION_MAPS_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] hover:text-gold-ink"
          >
            Get Directions
            <span aria-hidden>→</span>
          </a>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 overflow-hidden rounded-[28px] border border-line">
          <iframe
            title={`Map to ${LOCATION_NAME}`}
            src={LOCATION_MAPS_EMBED_URL}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[360px] w-full grayscale-[0.2] md:h-[440px]"
          />
        </Reveal>
      </section>
    </div>
  );
}
