import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay, over its REST API rather than the `razorpay` npm package.
 *
 * The package is a thin wrapper over the same two endpoints plus an HMAC, and
 * it drags in a request stack that does not run on an edge runtime. Everything
 * here is `fetch` and `node:crypto`, so the only dependency is the API itself.
 *
 * This module must never be imported from a Client Component: it reads the key
 * secret, and anything reachable from the browser bundle would ship it. Server
 * route handlers only.
 */

const API_BASE = "https://api.razorpay.com/v1";

/**
 * Read at call time, not at module load. A missing key must fail the one
 * checkout that needed it with a clear message, rather than crashing the whole
 * server on boot — including the pages that have nothing to do with payment.
 */
function credentials(): { keyId: string; keySecret: string } {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set to take payments.",
    );
  }

  return { keyId, keySecret };
}

/** The key id is public by design — the browser needs it to open the modal. */
export function razorpayKeyId(): string {
  return credentials().keyId;
}

/**
 * Razorpay counts in the currency's smallest unit. Every price in this codebase
 * is a whole-rupee Int, so the conversion is exact and no rounding is involved
 * — `Math.round` is here only to defend against a fractional price sneaking in,
 * because a non-integer amount is rejected by the API with a vague error.
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

/**
 * Creates the Razorpay order the checkout modal is opened against. The amount
 * sent here is the one the customer is actually charged, so it must come from
 * DB-resolved prices — never from the request body.
 */
export async function createRazorpayOrder(input: {
  amountInPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const { keyId, keySecret } = credentials();

  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: input.amountInPaise,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes,
    }),
  });

  if (!res.ok) {
    // Razorpay puts the useful part in error.description; the raw body is the
    // fallback for the rare non-JSON failure (a gateway 502, say).
    const body = await res.text();
    let description = body;
    try {
      description = JSON.parse(body)?.error?.description ?? body;
    } catch {
      // keep the raw body
    }
    throw new Error(`Razorpay order creation failed (${res.status}): ${description}`);
  }

  return res.json();
}

/**
 * Constant-time compare of two hex digests.
 *
 * `timingSafeEqual` throws rather than returns false when the lengths differ,
 * which is exactly the case a forged signature hits, so the length check comes
 * first. It leaks only the length of the attacker's own input.
 */
function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Proves a browser-reported success actually came from Razorpay.
 *
 * The handler callback runs in the customer's browser, so its payload is as
 * attacker-controlled as any other request body — without this check, anyone
 * could POST a made-up payment id and mark their own order paid. Only Razorpay
 * and this server know the key secret, so only they can produce the digest.
 */
export function isValidPaymentSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = credentials();
  const expected = createHmac("sha256", keySecret)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");

  return safeEqualHex(expected, input.signature);
}

/**
 * Same idea for webhooks, but over the exact bytes Razorpay sent and keyed on
 * the webhook secret (set in the dashboard, separate from the API secret).
 *
 * The caller must pass the raw request text: re-serialising the parsed JSON
 * reorders keys and changes whitespace, and the digest would never match.
 */
export function isValidWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not set.");
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
