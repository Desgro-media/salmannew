import type { Metadata } from "next";
import { PolicyPage } from "@/components/policies/PolicyPage";
import { POLICY_PAGES } from "@/lib/policies/pages";

export const metadata: Metadata = {
  title: `${POLICY_PAGES.terms.title} — Salman Perfumes`,
  description: POLICY_PAGES.terms.description,
};

export default function TermsPage() {
  return <PolicyPage slug="terms" />;
}
