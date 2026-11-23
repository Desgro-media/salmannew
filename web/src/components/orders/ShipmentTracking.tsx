import { safeHref, type ShipmentView } from "@/lib/shipment";

/**
 * The India Post tracking number, its link, and the scan history. Shared by the
 * customer's tracking page and the admin order page so they can never disagree
 * about what the parcel is doing.
 *
 * Purely presentational: the scan times arrive already formatted.
 */
export function ShipmentTracking({
  shipment,
  className,
}: {
  shipment: ShipmentView;
  className?: string;
}) {
  const href = safeHref(shipment.trackingUrl);

  return (
    <div className={className}>
      <p className="eyebrow text-ink-soft">India Post tracking</p>
      <p className="mt-3 text-sm">
        Tracking number{" "}
        <span className="select-all font-mono font-semibold">{shipment.trackingNumber}</span>
      </p>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-sm underline underline-offset-2 hover:text-gold-ink"
        >
          Track on India Post ↗
        </a>
      )}

      {shipment.scans.length > 0 ? (
        <ol className="mt-4 space-y-3 border-l border-line pl-4 text-sm">
          {shipment.scans.map((scan, i) => (
            <li key={i}>
              <span className="font-medium">{scan.status}</span>
              <span className="block text-xs text-ink-soft">
                {[scan.at, scan.place].filter(Boolean).join(" · ")}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-xs text-ink-soft">
          {shipment.scansLoaded
            ? "No scans yet — India Post adds them once the parcel has been picked up."
            : "Tracking updates can't be loaded right now. Try again in a moment."}
        </p>
      )}
    </div>
  );
}
