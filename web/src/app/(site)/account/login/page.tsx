"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 pt-16 md:pt-20">
      <p className="eyebrow text-ink-soft">Salman Perfumes</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight">Log In</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Field label="Email">
          <Input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </Field>
        <Field label="Password">
          <Input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Signing In…" : "Sign In"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        New here?{" "}
        <Link
          href={`/account/signup${redirectTo !== "/account" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="text-ink underline underline-offset-2 hover:text-gold-ink"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function AccountLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
