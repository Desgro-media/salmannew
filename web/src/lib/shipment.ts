// The shape of a booked shipment as pages show it. Kept apart from
// postbridge-orders.ts, which reaches the database and the PostBridge key, so
// that client components can import these without pulling any of that in.

/** One scan from India Post's public tracking, as PostBridge reports it. */
export interface TrackingScan {
  /** Ready to print (see formatScanTime), not a raw timestamp. */
  at: string | null;
  status: string;
  place: string | null;
}

export interface ShipmentView {
  trackingNumber: string;
  trackingUrl: string | null;
  scans: TrackingScan[];
  /** False when the scans could not be loaded just now, so "no scans yet" isn't claimed falsely. */
  scansLoaded: boolean;
}

// India Post's scans are in India. Pinning the zone means the server and the
// browser print the same text, so the page never disagrees with itself on
// hydration — and a customer abroad still sees when it happened in India.
const scanFormatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/**
 * PostBridge hands over the time as text. A date that can be read is shown in the
 * shop's usual style; anything else is shown exactly as received rather than
 * guessed at. Called on the server, so pages receive ready-to-print text.
 */
export function formatScanTime(at: string | null): string {
  if (!at) return "";
  const parsed = new Date(at);
  return Number.isNaN(parsed.getTime()) ? at : scanFormatter.format(parsed);
}

/** A link from outside is only ever followed if it is a web address. */
export function safeHref(url: string | null): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null;
}
