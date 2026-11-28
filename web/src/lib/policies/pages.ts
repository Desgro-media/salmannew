// The shop's policy pages. The set is fixed here (the footer, the About page and the
// admin all read this list); their text is what the admin can change.

export const POLICY_SLUGS = ["shipping", "returns", "privacy", "terms"] as const;

export type PolicySlug = (typeof POLICY_SLUGS)[number];

export interface PolicyPageInfo {
  slug: PolicySlug;
  path: string;
  title: string;
  description: string;
}

export const POLICY_PAGES: Record<PolicySlug, PolicyPageInfo> = {
  shipping: {
    slug: "shipping",
    path: "/shipping-policy",
    title: "Shipping Policy",
    description: "Delivery areas, charges, delivery time and order tracking.",
  },
  returns: {
    slug: "returns",
    path: "/return-policy",
    title: "Return & Refund Policy",
    description: "Damaged or wrong items, cancellations and refunds.",
  },
  privacy: {
    slug: "privacy",
    path: "/privacy-policy",
    title: "Privacy Policy",
    description: "What information we collect, why, and who we share it with.",
  },
  terms: {
    slug: "terms",
    path: "/terms",
    title: "Terms & Conditions",
    description: "The rules for using this website and buying from us.",
  },
};

export const POLICY_LIST: PolicyPageInfo[] = POLICY_SLUGS.map((slug) => POLICY_PAGES[slug]);

// A Set rather than `slug in POLICY_PAGES`: "constructor" must not look like a page.
const SLUG_SET: ReadonlySet<string> = new Set(POLICY_SLUGS);

export function isPolicySlug(value: string): value is PolicySlug {
  return SLUG_SET.has(value);
}

export const MAX_POLICY_BODY = 50_000;
export const MAX_POLICY_SUMMARY = 300;

/** "28 November 2026", in the shop's own time zone rather than the server's. */
export function formatPolicyDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}
