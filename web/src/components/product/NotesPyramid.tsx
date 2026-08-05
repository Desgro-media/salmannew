import type { FragranceNotes } from "@/lib/types";

const ROWS: { key: keyof FragranceNotes; label: string }[] = [
  { key: "top", label: "Top" },
  { key: "heart", label: "Heart" },
  { key: "base", label: "Base" },
];

export function NotesPyramid({
  notes,
  accent,
}: {
  notes: FragranceNotes;
  accent: string;
}) {
  return (
    <div
      className="flex flex-col gap-4 rounded-[24px] p-5"
      style={{ background: `linear-gradient(180deg, ${accent}14, var(--color-paper-2))` }}
    >
      {ROWS.map((row) => (
        <div key={row.key} className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
          <span className="shrink-0 rounded-full bg-paper px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft sm:w-20 sm:text-center">
            {row.label}
          </span>
          <div className="flex flex-wrap gap-2">
            {notes[row.key].map((note) => (
              <span
                key={note}
                className="rounded-full bg-paper px-3 py-1 text-xs text-ink"
              >
                {note}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
