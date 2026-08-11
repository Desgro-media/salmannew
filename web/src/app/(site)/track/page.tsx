import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { CUSTOMER_SESSION_COOKIE_NAME, verifyCustomerSessionToken } from "@/lib/customer-auth";
import { TrackOrderForm } from "@/components/orders/TrackOrderForm";

export const metadata: Metadata = {
  title: "Track Your Order — Salman Perfumes",
  description: "Follow your order from our counter to your door.",
};

// The session is read per request, so this cannot be prerendered.
export const dynamic = "force-dynamic";

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  // Prefilled when arriving from the confirmation screen. On its own the number
  // in the URL reveals nothing — ownership is still proved by the session or by
  // the typed email.
  const { order } = await searchParams;

  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyCustomerSessionToken(token) : null;

  return (
    // pt clears the fixed Header, as on every other page under this layout
    <div className="container-grid pb-12 pt-28 md:pb-16 md:pt-36">
      <p className="eyebrow text-ink-soft">Order Tracking</p>
      <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
        Where&rsquo;s my order?
      </h1>
      <p className="mt-4 max-w-md text-sm text-ink-soft">
        {session
          ? "Enter your order number — we already know it's you."
          : "Enter your order number and the email you checked out with. Both are on your confirmation screen."}
      </p>

      <TrackOrderForm
        initialOrderNumber={order ?? ""}
        signedInAs={session?.email ?? null}
      />

      <p className="mt-12 border-t border-line pt-6 text-sm text-ink-soft">
        {session ? (
          <>
            Prefer the full list?{" "}
            <Link href="/account" className="font-semibold text-ink underline underline-offset-2">
              See all your orders
            </Link>{" "}
            in your account.
          </>
        ) : (
          <>
            Have an account?{" "}
            <Link href="/account" className="font-semibold text-ink underline underline-offset-2">
              Sign in
            </Link>{" "}
            to see every order without looking each one up.
          </>
        )}
      </p>
    </div>
  );
}
