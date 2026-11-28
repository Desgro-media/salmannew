import Link from "next/link";
import { formatPolicyDate, POLICY_LIST } from "@/lib/policies/pages";
import { getPolicy } from "@/lib/policies/store";

export const dynamic = "force-dynamic";

export default async function AdminPoliciesPage() {
  const policies = await Promise.all(
    POLICY_LIST.map(async (page) => ({ page, policy: await getPolicy(page.slug) })),
  );

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Policies</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        The policy pages linked from the website&apos;s footer and About page. Saved
        changes show on the website straight away.
      </p>

      <ul className="mt-8 max-w-3xl divide-y divide-line border border-line">
        {policies.map(({ page, policy }) => (
          <li key={page.slug} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">{page.title}</h2>
              <p className="mt-1 text-sm text-ink-soft">
                {policy.isDefault ? "Default text, not edited yet" : `Last saved ${formatPolicyDate(policy.updatedAt)}`}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href={`/admin/policies/${page.slug}`}
                className="inline-flex min-h-11 items-center bg-ink px-5 text-xs font-semibold uppercase tracking-[0.14em] text-paper hover:bg-gold hover:text-ink"
              >
                Edit
              </Link>
              <a
                href={page.path}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center border border-ink px-5 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-ink hover:text-paper"
              >
                View page
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
