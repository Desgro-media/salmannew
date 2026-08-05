import { clsx } from "clsx";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

const fieldClass =
  "mt-1.5 w-full border border-line bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ink";

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
