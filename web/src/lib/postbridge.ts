// The PostBridge Partner API: books India Post shipments for us and reports back
// a tracking number, a label, and the scans. Docs and a live console:
// https://api.prodinent.com/partner-docs
//
// This file is only the wire — requests, errors, and reading replies. What to
// send for a given order, and what to do with the answer, lives in
// postbridge-orders.ts.
//
// The key is a server secret (POSTBRIDGE_API_KEY). Nothing here may be imported
// from a client component.

import type { TrackingScan } from "@/lib/shipment";

const DEFAULT_BASE = "https://api.prodinent.com/api/v1";
const TIMEOUT_MS = 15_000;

/**
 * Off unless POSTBRIDGE_ENABLED is exactly "true" *and* a key is present.
 *
 * The switch is separate from the key on purpose. A developer needs the key in
 * .env.local to run the contract check, and every order placed on localhost
 * would otherwise land on the live account as a real shipment. So the key
 * alone does nothing; the switch is set on the Production environment only.
 */
export function isPostbridgeEnabled(): boolean {
  return process.env.POSTBRIDGE_ENABLED === "true" && Boolean(process.env.POSTBRIDGE_API_KEY?.trim());
}

export class PostbridgeError extends Error {
  /** HTTP status, or null when there was no answer at all. */
  constructor(
    message: string,
    readonly status: number | null,
  ) {
    super(message);
  }
}

export interface PostbridgeOrderInput {
  externalOrderId: string;
  customer: { name: string; phone: string; email?: string };
  shippingAddress: {
    name: string;
    phone: string;
    email?: string;
    fullAddress: string;
    pincode: string;
    city: string;
    state: string;
    country: string;
  };
  products: { sku: string; qty: number; unitPrice: number; productName: string }[];
  payment: { method: "COD" | "Pre-paid" };
  amount: number;
  deliveryCharge: number;
  totalOrderValue: number;
  shipment?: { weightGrams: number };
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

async function send(method: "GET" | "POST", route: string, body?: unknown): Promise<Response> {
  const key = process.env.POSTBRIDGE_API_KEY?.trim();
  if (!key) throw new PostbridgeError("The PostBridge key is not set.", null);
  const base = (process.env.POSTBRIDGE_BASE_URL?.trim() || DEFAULT_BASE).replace(/\/$/, "");

  try {
    return await fetch(base + route, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        "User-Agent": "salman-perfumes-shop",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // Every call is about the present state of a shipment.
      cache: "no-store",
    });
  } catch (err) {
    const slow = err instanceof Error && err.name === "TimeoutError";
    throw new PostbridgeError(slow ? "PostBridge took too long to answer." : "Could not reach PostBridge.", null);
  }
}

/** The service words its errors as { message } (and sometimes { error }). */
function messageOf(body: unknown): string | null {
  if (!isObj(body)) return null;
  for (const k of ["message", "error"]) if (typeof body[k] === "string" && body[k]) return body[k] as string;
  return null;
}

async function call(method: "GET" | "POST", route: string, body?: unknown): Promise<unknown> {
  const res = await send(method, route, body);
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  // Every reply carries `success`; a 200 that says false is still a refusal.
  if (!res.ok || (isObj(parsed) && parsed.success === false)) {
    throw new PostbridgeError(messageOf(parsed) ?? `PostBridge answered ${res.status}.`, res.status);
  }
  return parsed;
}

const enc = encodeURIComponent;

export const postbridge = {
  /** Idempotent on externalOrderId: sending the same id again returns the existing order. */
  createOrder: (input: PostbridgeOrderInput) => call("POST", "/orders", input),
  getOrder: (id: string) => call("GET", `/orders/${enc(id)}`),
  /** Refused by PostBridge once the order is Manifested. */
  cancelOrder: (id: string) => call("POST", `/orders/${enc(id)}/cancel`),
  /** Books a real India Post shipment and assigns its article number. Not undoable from here. */
  bookOrder: (id: string) => call("POST", `/orders/${enc(id)}/book`, {}),
  getTracking: (id: string) => call("GET", `/orders/${enc(id)}/tracking`),

  /** The shipping label, a PDF. Needs the order to have an article first. */
  async getLabel(id: string): Promise<{ bytes: ArrayBuffer; contentType: string }> {
    const res = await send("GET", `/orders/${enc(id)}/label`);
    if (!res.ok) {
      let parsed: unknown = null;
      try {
        parsed = await res.json();
      } catch {
        /* not JSON */
      }
      throw new PostbridgeError(messageOf(parsed) ?? `PostBridge answered ${res.status}.`, res.status);
    }
    return { bytes: await res.arrayBuffer(), contentType: res.headers.get("content-type") ?? "application/pdf" };
  },
};

// ---------------------------------------------------------------------------
// Reading replies
//
// The docs say what to send but never show an answer. The live API has since
// been called (create, get, tracking, cancel), so the order and tracking names
// below are the real ones. What has not been seen is a *booked* order's scans:
// their fields are guessed, and an unrecognised scan is shown as its own text
// rather than dropped. Fixing a wrong name is one line in the lists below.
// ---------------------------------------------------------------------------

/** First non-empty string (or number) under any of `keys`, searched shallowest-first. */
function findText(root: unknown, keys: string[], maxDepth = 3): string | undefined {
  const queue: [unknown, number][] = [[root, 0]];
  while (queue.length > 0) {
    const [node, depth] = queue.shift()!;
    if (!isObj(node)) continue;
    for (const key of keys) {
      const hit = Object.entries(node).find(([k]) => k.toLowerCase() === key.toLowerCase());
      const v = hit?.[1];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number") return String(v);
    }
    if (depth < maxDepth) for (const v of Object.values(node)) if (isObj(v)) queue.push([v, depth + 1]);
  }
  return undefined;
}

function findObjects(root: unknown, keys: string[], maxDepth = 3): Record<string, unknown>[] | undefined {
  const queue: [unknown, number][] = [[root, 0]];
  while (queue.length > 0) {
    const [node, depth] = queue.shift()!;
    if (!isObj(node)) continue;
    for (const key of keys) {
      const hit = Object.entries(node).find(([k]) => k.toLowerCase() === key.toLowerCase());
      if (Array.isArray(hit?.[1]) && (hit[1] as unknown[]).every(isObj)) return hit[1] as Record<string, unknown>[];
    }
    if (depth < maxDepth) for (const v of Object.values(node)) if (isObj(v)) queue.push([v, depth + 1]);
  }
  return undefined;
}

// Seen on the live API: the order carries `articleId` (the India Post number) and
// `trackingLink`, both null until a shipment is booked, plus `scans` and
// `labelAvailable`. The other names are fallbacks, in case a reply ever differs.
// `orderID` is PostBridge's own id and must never be mistaken for a tracking number.
const NUMBER_KEYS = ["articleId", "trackingNumber", "articleNumber", "article", "barcode", "awb", "awbNumber", "trackingId", "articleNo"];
const URL_KEYS = ["trackingLink", "trackingUrl", "trackUrl", "trackingPage"];
const SCAN_LIST_KEYS = ["scans", "events", "history", "trackingEvents", "trackingHistory", "timeline", "tracking"];
const SCAN_TIME_KEYS = ["at", "date", "dateTime", "datetime", "timestamp", "time", "eventDate", "scannedAt"];
const SCAN_TEXT_KEYS = ["status", "event", "description", "activity", "remarks", "message", "state"];
const SCAN_PLACE_KEYS = ["location", "office", "place", "city", "facility", "branch"];

export interface PostbridgeOrderState {
  status?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

/** What an order reply says about the order: its PostBridge status and, once booked, its article. */
export function readOrderReply(reply: unknown): PostbridgeOrderState {
  return {
    status: findText(reply, ["status", "orderStatus"]),
    trackingNumber: findText(reply, NUMBER_KEYS),
    trackingUrl: findText(reply, URL_KEYS),
  };
}

export interface TrackingInfo {
  trackingNumber: string | null;
  trackingUrl: string | null;
  scans: TrackingScan[];
}

export function readTracking(reply: unknown): TrackingInfo {
  const scans = (findObjects(reply, SCAN_LIST_KEYS) ?? []).map((scan): TrackingScan => {
    const status = findText(scan, SCAN_TEXT_KEYS, 0);
    return {
      at: findText(scan, SCAN_TIME_KEYS, 0) ?? null,
      // If none of the usual names fit, show whatever text the scan carries
      // rather than dropping it.
      status:
        status ??
        Object.values(scan)
          .filter((v): v is string => typeof v === "string" && v.trim() !== "")
          .join(" · "),
      place: findText(scan, SCAN_PLACE_KEYS, 0) ?? null,
    };
  });

  return {
    trackingNumber: findText(reply, NUMBER_KEYS) ?? null,
    trackingUrl: findText(reply, [...URL_KEYS, "link"]) ?? null,
    scans: scans.filter((s) => s.status !== ""),
  };
}
