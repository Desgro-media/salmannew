import type { Metadata } from "next";
import { PolicyPage } from "@/components/policies/PolicyPage";
import { POLICY_PAGES } from "@/lib/policies/pages";

export const metadata: Metadata = {
  title: `${POLICY_PAGES.shipping.title} — Salman Perfumes`,
  description: POLICY_PAGES.shipping.description,
};

export default function ShippingPolicyPage() {
  return <PolicyPage slug="shipping" />;
}
