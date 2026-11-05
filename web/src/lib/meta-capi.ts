import { createHash } from "node:crypto";
import { isIP } from "node:net";

// Meta's Conversions API: the server-side twin of the browser pixel's Purchase.
//
// The browser reports a purchase without saying who made it, and only when the
// customer's tab survives long enough to run the script. This reports the same
// purchase from the server with the customer's details attached (hashed, as
// Meta requires), which is what lets Meta match a sale to the ad that earned it
// — and it still fires when the Razorpay webhook is the one that settles an
// order after the tab was closed.
//
// The two reports are merged by Meta, not by us: same event name and same event
// id, within 48 hours, counted once. The id is the order number — the value
// lib/meta-pixel.ts already gives the browser's Purchase.
//
// Nothing here reads the database or the request body, so every rule below can
// be exercised on its own. lib/payments.ts does the reading.

const GRAPH_VERSION = "v27.0";
const CURRENCY = "INR";
// The store ships within India only, so every customer is in this country.
const COUNTRY = "in";
const REQUEST_TIMEOUT_MS = 8000;

export interface MetaCapiConfig {
  pixelId: string;
  accessToken: string;
  /** Only while checking Events Manager → Test events; see .env.example. */
  testEventCode?: string;
}

/**
 * Null means switched off — the same convention as META_PIXEL_ID. Both values are
 * needed: the pixel id says which dataset the event belongs to, the token is what
 * Meta checks before accepting it. Leave the token unset in dev and on preview
 * deploys, or every test checkout is reported to Meta as a real sale.
 */
export function metaCapiConfig(env: NodeJS.ProcessEnv = process.env): MetaCapiConfig | null {
  const pixelId = env.META_PIXEL_ID?.trim();
  const accessToken = env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!pixelId || !accessToken) return null;

  // It is written into a URL below, so a stray character would aim the request
  // somewhere else rather than just at the wrong dataset.
  if (!/^\d+$/.test(pixelId)) return null;

  return {
    pixelId,
    accessToken,
    testEventCode: env.META_CAPI_TEST_EVENT_CODE?.trim() || undefined,
  };
}

/**
 * What Meta wants to know about the browser. The names are the Order columns
 * these are stored in, so a checkout can spread the result straight into its
 * create call.
 */
export interface BrowserSignals {
  metaFbp?: string;
  metaFbc?: string;
  clientIp?: string;
  clientUserAgent?: string;
  checkoutUrl?: string;
}

// Cookies and headers are chosen by whoever sends the request, and these end up
// in our database and in a payload to Meta. Anything that does not look like
// what it claims to be is dropped rather than passed along.
const FBP_PATTERN = /^fb\.\d{1,2}\.\d{10,13}\.\d{1,20}$/;
const FBC_PATTERN = /^fb\.\d{1,2}\.\d{10,13}\.[\w-]{1,200}$/;
const MAX_USER_AGENT_LENGTH = 512;

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * The page the customer was on, without its query string: that can carry
 * click ids and tracking parameters the event has no use for. Falls back to the
 * checkout page of the site the request came to, since the Referer header is
 * optional and some browsers withhold it.
 */
function checkoutUrlFor(request: Request): string | undefined {
  try {
    const referer = request.headers.get("referer");
    const page = new URL(referer ?? "/checkout", request.url);
    return `${page.origin}${page.pathname}`;
  } catch {
    return undefined;
  }
}

export function readBrowserSignals(request: Request): BrowserSignals {
  const cookieHeader = request.headers.get("cookie");
  const fbp = readCookie(cookieHeader, "_fbp");
  const fbc = readCookie(cookieHeader, "_fbc");

  // On Vercel the first entry is the visitor; anything after it was added by a
  // proxy along the way.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip")?.trim() || undefined;

  const userAgent = request.headers.get("user-agent")?.trim();

  return {
    metaFbp: fbp && FBP_PATTERN.test(fbp) ? fbp : undefined,
    metaFbc: fbc && FBC_PATTERN.test(fbc) ? fbc : undefined,
    clientIp: ip && isIP(ip) ? ip : undefined,
    clientUserAgent: userAgent ? userAgent.slice(0, MAX_USER_AGENT_LENGTH) : undefined,
    checkoutUrl: checkoutUrlFor(request),
  };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Lowercase letters and digits only — Meta's rule for names, city and state. */
function lettersAndDigits(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Digits with the country code and no leading zeros, which is what Meta hashes.
 * A bare ten-digit number is an Indian mobile, so it gets 91; anything longer
 * already carries its country code. Null when there is nothing usable, so a
 * mistyped number is left out rather than hashed into a value that matches
 * nobody.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

/** First and last word of the name; a single word is a first name only. */
function splitName(fullName: string): { first?: string; last?: string } {
  const words = fullName.trim().split(/\s+/).map(lettersAndDigits).filter(Boolean);
  if (words.length === 0) return {};
  if (words.length === 1) return { first: words[0] };
  return { first: words[0], last: words[words.length - 1] };
}

/** The slice of an order the event is built from. */
export interface PurchaseOrder {
  orderNumber: string;
  total: number;
  customerId: string | null;
  customerFullName: string;
  customerEmail: string;
  customerPhone: string;
  customerCity: string;
  customerState: string;
  customerPincode: string;
  items: { sku: string; quantity: number; price: number }[];
  metaFbp: string | null;
  metaFbc: string | null;
  clientIp: string | null;
  clientUserAgent: string | null;
  checkoutUrl: string | null;
}

type HashedList = string[];

export interface PurchaseEvent {
  event_name: "Purchase";
  event_time: number;
  event_id: string;
  action_source: "website";
  event_source_url: string;
  user_data: {
    em?: HashedList;
    ph?: HashedList;
    fn?: HashedList;
    ln?: HashedList;
    ct?: HashedList;
    st?: HashedList;
    zp?: HashedList;
    country: HashedList;
    external_id?: HashedList;
    client_ip_address?: string;
    client_user_agent: string;
    fbp?: string;
    fbc?: string;
  };
  custom_data: {
    currency: string;
    value: number;
    content_type: "product";
    content_ids: string[];
    contents: { id: string; quantity: number; item_price: number }[];
    num_items: number;
    order_id: string;
  };
}

/**
 * Meta rejects a website event that has no user agent or page url, so an order
 * without them cannot be reported as one. That only happens to an order opened
 * before this was deployed and paid after — it gets no event rather than a
 * malformed one.
 */
export function buildPurchaseEvent(
  order: PurchaseOrder,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): PurchaseEvent | null {
  if (!order.checkoutUrl || !order.clientUserAgent) return null;

  const hashed = (value: string | null | undefined): HashedList | undefined =>
    value ? [sha256(value)] : undefined;

  const name = splitName(order.customerFullName);
  const phone = normalizePhone(order.customerPhone);
  const email = order.customerEmail.trim().toLowerCase();

  const userData: PurchaseEvent["user_data"] = {
    em: hashed(email),
    ph: hashed(phone),
    fn: hashed(name.first),
    ln: hashed(name.last),
    ct: hashed(lettersAndDigits(order.customerCity)),
    // India has no two-letter convention Meta documents, so the full name goes
    // through the same lowercase, no-spaces rule as any non-US state.
    st: hashed(lettersAndDigits(order.customerState)),
    zp: hashed(order.customerPincode.toLowerCase().replace(/[\s-]/g, "")),
    country: [sha256(COUNTRY)],
    external_id: hashed(order.customerId),
    client_ip_address: order.clientIp ?? undefined,
    client_user_agent: order.clientUserAgent,
    fbp: order.metaFbp ?? undefined,
    fbc: order.metaFbc ?? undefined,
  };

  // Absent keys, not empty ones: Meta treats a blank value as a malformed one.
  for (const key of Object.keys(userData) as (keyof typeof userData)[]) {
    if (userData[key] === undefined) delete userData[key];
  }

  return {
    event_name: "Purchase",
    event_time: nowSeconds,
    event_id: order.orderNumber,
    action_source: "website",
    event_source_url: order.checkoutUrl,
    user_data: userData,
    // The same shape the browser's Purchase carries (lib/meta-pixel.ts), so the
    // two describe the sale identically; `value` is the order total in rupees,
    // which is also what the browser reports.
    custom_data: {
      currency: CURRENCY,
      value: order.total,
      content_type: "product",
      content_ids: order.items.map((item) => item.sku),
      contents: order.items.map((item) => ({
        id: item.sku,
        quantity: item.quantity,
        item_price: item.price,
      })),
      num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      order_id: order.orderNumber,
    },
  };
}

/**
 * Posts the event to Meta. Throws on anything but a clean acceptance, so the
 * caller can log it; it never retries, because a retry of a rejected payload is
 * the same rejection. The token goes in the body rather than the URL so it does
 * not end up in anyone's request logs.
 */
export async function sendPurchaseEvent(
  config: MetaCapiConfig,
  event: PurchaseEvent,
): Promise<void> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${config.pixelId}/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [event],
        access_token: config.accessToken,
        ...(config.testEventCode ? { test_event_code: config.testEventCode } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Meta responded ${response.status}: ${detail.slice(0, 300)}`);
  }

  const result: unknown = await response.json().catch(() => null);
  const received = (result as { events_received?: unknown } | null)?.events_received;
  if (typeof received === "number" && received < 1) {
    throw new Error("Meta accepted the request but received no events.");
  }
}
