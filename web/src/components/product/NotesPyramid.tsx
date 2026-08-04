import type { FragranceNotes } from "@/lib/types";

const ROWS: { key: keyof FragranceNotes; label: string }[] = [
  { key: "top", label: "Top" },
  { key: "heart", label: "Heart" },
  { key: "base", label: "Base" },
];

export function NotesPyramid({ notes }: { notes: FragranceNotes }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {ROWS.map((row) => (
        <div key={row.key} className="grid grid-cols-[6rem_1fr] gap-4 py-4 md:grid-cols-[8rem_1fr]">
          <span className="eyebrow text-ink-soft">{row.label}</span>
          <span className="text-sm">{notes[row.key].join(" · ")}</span>
        </div>
      ))}
    </div>
  );
}
