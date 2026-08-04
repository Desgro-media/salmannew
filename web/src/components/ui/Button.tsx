import { clsx } from "clsx";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap uppercase tracking-[0.14em] text-xs font-semibold transition-colors duration-300 disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper px-7 py-3.5 hover:bg-gold hover:text-ink",
  secondary:
    "bg-transparent text-ink px-7 py-3.5 border border-ink hover:bg-ink hover:text-paper",
  ghost: "bg-transparent text-ink px-0 py-1 underline-offset-4 hover:text-gold-ink",
};

interface CommonProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

export function Button({
  children,
  variant = "primary",
  className,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={clsx(base, variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  variant = "primary",
  className,
  href,
}: CommonProps & { href: string }) {
  return (
    <Link href={href} className={clsx(base, variants[variant], className)}>
      {children}
    </Link>
  );
}
