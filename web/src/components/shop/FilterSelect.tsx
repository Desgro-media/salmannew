"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

// A drawn dropdown rather than a native <select>. The native control renders in
// OS chrome — system font, blue highlight, white panel — which is the one thing
// in this row that ignores the site's type and palette. Everything here is the
// same border, caps and tracking as the filter chips beside it.
//
// Kept to a button and a panel of buttons: no listbox/option roles, because
// claiming that pattern without arrow-key navigation and typeahead describes a
// control this isn't. Tab reaches every option, Escape and an outside click
// close it.
export function FilterSelect<T extends string>({
  label,
  value,
  options,
  format,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  format: (option: T) => string;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    // Focus leaving the group closes it too, so tabbing past the last option
    // doesn't leave a panel hanging open behind the grid.
    function onFocusIn(event: FocusEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [open]);

  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-haspopup="true"
        aria-expanded={open}
        className={clsx(
          "flex items-center gap-2 border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors",
          open
            ? "border-ink text-ink"
            : "border-line text-ink-soft hover:border-ink hover:text-ink",
        )}
      >
        <span className="text-ink-soft">{label}</span>
        <span className="text-ink">{format(value)}</span>
        <svg
          viewBox="0 0 10 6"
          className={clsx(
            "h-1.5 w-2.5 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
          focusable="false"
        >
          <path
            d="M1 1l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-full border border-ink bg-paper">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              aria-current={option === value}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={clsx(
                "block w-full whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.12em] transition-colors",
                option === value
                  ? "bg-ink text-paper"
                  : "text-ink-soft hover:bg-paper-2 hover:text-ink",
              )}
            >
              {format(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
