import { cache } from "react";
import { prisma } from "@/lib/db";
import { DEFAULT_POLICIES, DEFAULT_POLICIES_DATE, type PolicyText } from "./defaults";
import type { PolicySlug } from "./pages";

export interface Policy extends PolicyText {
  updatedAt: Date;
  /** True until the admin saves their own text. */
  isDefault: boolean;
}

/** One policy as customers should see it: the saved text, or the default. Server-only. */
export const getPolicy = cache(async (slug: PolicySlug): Promise<Policy> => {
  const row = await prisma.policy.findUnique({ where: { slug } });
  if (!row) return { ...DEFAULT_POLICIES[slug], updatedAt: DEFAULT_POLICIES_DATE, isDefault: true };

  return {
    body: row.body,
    summary: row.summary ?? DEFAULT_POLICIES[slug].summary,
    updatedAt: row.updatedAt,
    isDefault: false,
  };
});
