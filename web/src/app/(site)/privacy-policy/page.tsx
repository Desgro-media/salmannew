import type { Metadata } from "next";
import { PolicyPage } from "@/components/policies/PolicyPage";
import { POLICY_PAGES } from "@/lib/policies/pages";

export const metadata: Metadata = {
  title: `${POLICY_PAGES.privacy.title} — Salman Perfumes`,
  description: POLICY_PAGES.privacy.description,
};

export default function PrivacyPolicyPage() {
  return <PolicyPage slug="privacy" />;
}
