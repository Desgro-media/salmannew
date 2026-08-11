import { clsx } from "clsx";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

// min-h-11 keeps every field a 44px touch target on a phone.
//
// text-base is load-bearing rather than cosmetic: iOS Safari zooms the page in
// whenever a focused input's text is under 16px, and it does not zoom back out
// on blur — so a 14px field leaves the user scrolled sideways through the rest
// of the form. It drops back to text-sm from sm up, where no such rule applies.
const fieldClass =
  "mt-1.5 min-h-11 w-full border border-line bg-transparent px-3.5 py-2.5 text-base outline-none transition-colors focus:border-ink sm:text-sm";

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(fieldClass, className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(fieldClass, className)} {...rest} />;
}

export function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
