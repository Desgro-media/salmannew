import type { ReactNode } from "react";

/**
 * The reassurance strip under the buy button: three promises, each with its
 * own icon, then the ways a customer can pay.
 *
 * The payment row lists what checkout really offers — Razorpay takes cards
 * (Visa, Mastercard, RuPay) and UPI, Google Pay among the UPI apps. Cash on
 * delivery is shown only while the admin has it switched on (`showCod`), the
 * same flag checkout reads. Don't add a logo here for a method CheckoutForm
 * can't take; it would be a promise the store can't keep.
 *
 * Server component: no state, no browser APIs, so it adds nothing to the
 * client bundle.
 */

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  className: "h-7 w-7",
} as const;

/** Shield with a tick — "genuine, verified". */
function GenuineIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3l7.5 2.8v5.6c0 4.5-3.1 8.1-7.5 9.6-4.4-1.5-7.5-5.1-7.5-9.6V5.8L12 3z" />
      <path d="M8.6 12.2l2.5 2.5 4.4-4.9" />
    </svg>
  );
}

/** Delivery truck. */
function DeliveryIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2.5 6.5h10.5v10.5H2.5z" />
      <path d="M13 10h4.2l3.3 3.3V17H13z" />
      <circle cx="7" cy="17.8" r="1.8" fill="var(--color-paper)" />
      <circle cx="16.8" cy="17.8" r="1.8" fill="var(--color-paper)" />
    </svg>
  );
}

/** Padlock on a card — "your payment is protected". */
function SecureIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
      <path d="M3 9.8h18" />
      <rect x="12.4" y="12.6" width="6.2" height="4.9" rx="1" fill="var(--color-paper)" />
      <path d="M13.9 12.6v-1a1.6 1.6 0 013.2 0v1" />
    </svg>
  );
}

const FEATURES: { label: string; icon: ReactNode }[] = [
  { label: "100% Genuine and Authentic Products", icon: <GenuineIcon /> },
  { label: "All India Delivery", icon: <DeliveryIcon /> },
  { label: "Secure Payment", icon: <SecureIcon /> },
];

/* ── Payment marks ──────────────────────────────────────────────────────
   Drawn as small inline SVGs so they cost no requests and stay crisp. They
   are simplified wordmarks in each brand's colours, not the official
   artwork — swap in the brand kits' files if exact logos are ever needed. */

function Visa() {
  return (
    <svg viewBox="0 0 48 16" className="h-4 w-auto" aria-hidden>
      <text
        x="24"
        y="13"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="15"
        fontWeight="800"
        fontStyle="italic"
        letterSpacing="-0.5"
        fill="#1a1f71"
      >
        VISA
      </text>
    </svg>
  );
}

function Mastercard() {
  return (
    <svg viewBox="0 0 32 20" className="h-5 w-auto" aria-hidden>
      <circle cx="12" cy="10" r="8" fill="#eb001b" />
      <circle cx="20" cy="10" r="8" fill="#f79e1b" />
      <path d="M16 3.8a8 8 0 010 12.4 8 8 0 010-12.4z" fill="#ff5f00" />
    </svg>
  );
}

function RuPay() {
  return (
    <svg viewBox="0 0 48 16" className="h-4 w-auto" aria-hidden>
      <text
        x="24"
        y="12.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="13"
        fontWeight="800"
        fontStyle="italic"
        letterSpacing="-0.4"
      >
        <tspan fill="#1c4a9c">Ru</tspan>
        <tspan fill="#f26b21">Pay</tspan>
      </text>
    </svg>
  );
}

function Upi() {
  return (
    <svg viewBox="0 0 44 16" className="h-4 w-auto" aria-hidden>
      <text
        x="2"
        y="13"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="14"
        fontWeight="800"
        fontStyle="italic"
        fill="#3b3b3b"
      >
        UPI
      </text>
      <path d="M31 2.5l5 5.5-5 5.5V2.5z" fill="#f58220" />
      <path d="M36.5 2.5l5 5.5-5 5.5V2.5z" fill="#097939" />
    </svg>
  );
}

function GooglePay() {
  return (
    <svg viewBox="0 0 54 20" className="h-[18px] w-auto" aria-hidden>
      <g transform="translate(1 2) scale(0.67)">
        <path
          fill="#4285f4"
          d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
        />
        <path
          fill="#34a853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
        />
        <path
          fill="#fbbc05"
          d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
        />
        <path
          fill="#ea4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
        />
      </g>
      <text
        x="20"
        y="14.5"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="13"
        fontWeight="600"
        fill="#5f6368"
      >
        Pay
      </text>
    </svg>
  );
}

/** Banknote — cash paid at the door. Paired with text, since there's no
    brand mark for "cash". */
function CashOnDelivery() {
  return (
    <>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#2e7d4f"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px] shrink-0"
        aria-hidden
      >
        <rect x="2.5" y="6" width="19" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.6" />
        <path d="M6 9.2v.01M18 14.8v.01" />
      </svg>
      <span className="text-[10px] font-semibold leading-[1.1] text-ink-soft">
        Cash on
        <br />
        Delivery
      </span>
    </>
  );
}

const PAYMENTS: { name: string; mark: ReactNode }[] = [
  { name: "Visa", mark: <Visa /> },
  { name: "Mastercard", mark: <Mastercard /> },
  { name: "RuPay", mark: <RuPay /> },
  { name: "UPI", mark: <Upi /> },
  { name: "Google Pay", mark: <GooglePay /> },
];

export function TrustBadges({ showCod }: { showCod: boolean }) {
  return (
    <div className="mt-6">
      <ul className="grid grid-cols-3 gap-2">
        {FEATURES.map((f) => (
          <li
            key={f.label}
            className="flex flex-col items-center gap-2 text-center text-ink"
          >
            {f.icon}
            <span className="text-balance text-[11px] font-medium leading-snug text-ink-soft">
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      <ul
        className="mt-5 flex flex-wrap items-center justify-center gap-2"
        aria-label="Accepted payment methods"
      >
        {PAYMENTS.map((p) => (
          <li
            key={p.name}
            title={p.name}
            role="img"
            aria-label={p.name}
            className="flex h-9 w-[3.25rem] items-center justify-center rounded-md border border-line bg-white shadow-[0_1px_2px_rgba(19,17,16,0.05)]"
          >
            {p.mark}
          </li>
        ))}
        {showCod && (
          <li
            title="Cash on Delivery"
            role="img"
            aria-label="Cash on Delivery"
            className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-line bg-white px-2 shadow-[0_1px_2px_rgba(19,17,16,0.05)]"
          >
            <CashOnDelivery />
          </li>
        )}
      </ul>
    </div>
  );
}
