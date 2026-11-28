import type { Metadata } from "next";
import { PolicyPage } from "@/components/policies/PolicyPage";
import { POLICY_PAGES } from "@/lib/policies/pages";

export const metadata: Metadata = {
  title: `${POLICY_PAGES.returns.title} — Salman Perfumes`,
  description: POLICY_PAGES.returns.description,
};

export default function ReturnPolicyPage() {
  return <PolicyPage slug="returns" />;
}
