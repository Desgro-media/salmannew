import Link from "next/link";
import { PolicyBody } from "./PolicyBody";
import { formatPolicyDate, POLICY_LIST, POLICY_PAGES, type PolicySlug } from "@/lib/policies/pages";
import { fillPlaceholders, placeholderValues } from "@/lib/policies/placeholders";
import { getPolicy } from "@/lib/policies/store";
import { getStoreSettings } from "@/lib/store-settings";

export async function PolicyPage({ slug }: { slug: PolicySlug }) {
  const [policy, settings] = await Promise.all([getPolicy(slug), getStoreSettings()]);
  const page = POLICY_PAGES[slug];

  return (
    <div className="pt-16 md:pt-20">
      <section className="container-grid border-b border-line py-14 md:py-24">
        <p className="eyebrow text-ink-soft">Policies</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
          {page.title}
        </h1>
        <p className="mt-5 text-sm text-ink-soft">Last updated {formatPolicyDate(policy.updatedAt)}</p>
      </section>

      <div className="container-grid grid grid-cols-1 gap-12 py-12 md:grid-cols-12 md:py-20">
        {/* Below the text on a phone, so the policy is the first thing on screen. */}
        <nav aria-label="Policies" className="order-2 border-t border-line pt-8 md:order-1 md:col-span-3 md:border-t-0 md:pt-0">
          <p className="eyebrow text-ink-soft">All policies</p>
          <ul className="mt-4 space-y-1 text-sm">
            {POLICY_LIST.map((item) => (
              <li key={item.slug}>
                <Link
                  href={item.path}
                  aria-current={item.slug === slug ? "page" : undefined}
                  className="flex min-h-11 items-center text-ink-soft hover:text-gold-ink aria-[current=page]:font-semibold aria-[current=page]:text-ink md:min-h-9"
                >
                  {item.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contact" className="flex min-h-11 items-center text-ink-soft hover:text-gold-ink md:min-h-9">
                Contact us
              </Link>
            </li>
          </ul>
        </nav>

        <article className="order-1 max-w-2xl md:order-2 md:col-span-8 md:col-start-5">
          <PolicyBody text={fillPlaceholders(policy.body, placeholderValues(settings))} />
        </article>
      </div>
    </div>
  );
}
