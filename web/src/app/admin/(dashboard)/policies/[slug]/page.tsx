import Link from "next/link";
import { notFound } from "next/navigation";
import { PolicyEditor } from "@/components/admin/PolicyEditor";
import { DEFAULT_POLICIES } from "@/lib/policies/defaults";
import { formatPolicyDate, isPolicySlug, POLICY_PAGES } from "@/lib/policies/pages";
import { placeholderValues } from "@/lib/policies/placeholders";
import { getPolicy } from "@/lib/policies/store";
import { getStoreSettings } from "@/lib/store-settings";

export const dynamic = "force-dynamic";

export default async function AdminPolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isPolicySlug(slug)) notFound();

  const [policy, settings] = await Promise.all([getPolicy(slug), getStoreSettings()]);
  const page = POLICY_PAGES[slug];

  return (
    <div>
      <Link href="/admin/policies" className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft hover:text-ink">
        <span aria-hidden>←</span> All policies
      </Link>
      <h1 className="mt-4 text-3xl font-black tracking-tight">{page.title}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {policy.isDefault ? "Showing the default text." : `Last saved ${formatPolicyDate(policy.updatedAt)}.`}{" "}
        <a href={page.path} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
          View page
        </a>
      </p>

      <div className="mt-8">
        <PolicyEditor
          slug={slug}
          saved={{ body: policy.body, summary: policy.summary }}
          fallback={DEFAULT_POLICIES[slug]}
          isDefault={policy.isDefault}
          values={placeholderValues(settings)}
        />
      </div>
    </div>
  );
}
