import { clsx } from "clsx";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

// min-h-11 keeps every field a 44px touch target on a phone.
//
// text-base is load-bearing rather than cosmetic: iOS Safari zooms the page in
// whenever a focused input's text is under 16px, and it does not zoom back out
// on blur — so a 14px field leaves the user scrolled sideways through the rest
// of the form. It drops back to text-sm from sm up, where no such rule applies.
//
// aria-invalid turns the border red. The stacked focus variant keeps it red
// while the field is focused, instead of flipping back to the ink colour.
const fieldClass =
  "mt-1.5 min-h-11 w-full border border-line bg-transparent px-3.5 py-2.5 text-base outline-none transition-colors focus:border-ink aria-invalid:border-red-600 aria-invalid:bg-red-50/50 aria-invalid:focus:border-red-600 sm:text-sm";

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
  error,
  children,
}: {
  label: string;
  className?: string;
  /** shown in red under the field; the label turns red too */
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className={clsx("text-xs font-medium", error ? "text-red-700" : "text-ink-soft")}>
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-700">{error}</span>}
    </label>
  );
}
