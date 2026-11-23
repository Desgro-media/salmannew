/**
 * A contract check for the PostBridge Partner API — the one documented, with a
 * live console, at https://api.prodinent.com/partner-docs.
 *
 * It exists for two reasons. The docs list what to send but not what comes back,
 * so this records the real response shapes before the shop is wired to them. And
 * it turns the claims the docs *do* make (an unknown product saves as Pending,
 * sending the same externalOrderId twice returns the same order, cancelling
 * works) into checks that pass or fail, so a change on their side shows up here
 * rather than in a customer's order.
 *
 * Stages, from safest to least:
 *
 *   docs      reads the public docs page and compares it with what this check
 *             sends. No key needed.
 *   no key    two unauthenticated GETs: is the API there, and does it refuse
 *             strangers the way it should? No key needed.
 *   read      GET /me, /warehouses and /orders. Needs the connection key. Changes
 *             nothing.
 *   write     (only with --write) creates TEST orders on the real account, looks
 *             at them, and cancels every one — even if a check fails halfway.
 *
 * What it will never do, enforced in call() below and not just by convention:
 * book a shipment, assign a barcode, or fetch a label. Those use up real India
 * Post articles and cannot be undone from here.
 *
 * Usage (from web/):
 *   npx tsx scripts/postbridge/check.ts                  docs + no-key stages, plus
 *                                                        the read stage if a key is set
 *   npx tsx scripts/postbridge/check.ts --write          …and the write stage
 *   npx tsx scripts/postbridge/check.ts --write --sku SP-IMP-050
 *                                                        use a real catalogue SKU, to see
 *                                                        a matched product (default is a
 *                                                        fake one, which must come back Pending)
 *   npx tsx scripts/postbridge/check.ts --write --skus SP-IMP-020,SP-IMP-050,…
 *                                                        send every code you sell in ONE test
 *                                                        order and list the ones PostBridge's
 *                                                        catalogue does not have yet — re-run it
 *                                                        after adding products there
 *   npx tsx scripts/postbridge/check.ts --mock --write   run everything against a local
 *                                                        stand-in server instead of the
 *                                                        real API — proves this script
 *                                                        works, says nothing about PostBridge
 *
 * The key goes in web/.env.local (gitignored) as POSTBRIDGE_API_KEY=pb_live_…
 * and is never printed.
 */

import { parseArgs } from "node:util";
import { tmpdir } from "node:os";
import path from "node:path";
import { writeFileSync } from "node:fs";
import { config } from "dotenv";
import { startMock, type MockServer } from "./mock";

// Same order as prisma.config.ts: .env.local first, and neither overwrites a
// variable that is already set in the environment.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

const DEFAULT_BASE = "https://api.prodinent.com/api/v1";
const DOCS_URL = "https://api.prodinent.com/partner-docs";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

type Json = unknown;
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * The response shapes are undocumented, so these look in the places the console
 * on the docs page itself looks (`data.order?.externalOrderId || data.externalOrderId`)
 * and a couple of other common spots, rather than insisting on one layout.
 */
function orderOf(json: Json): Record<string, unknown> | null {
  if (!isObj(json)) return null;
  if (isObj(json.order)) return json.order;
  if (isObj(json.data)) return json.data;
  return json;
}
const idOf = (json: Json) => str(orderOf(json)?.externalOrderId);
const statusOf = (json: Json) => str(orderOf(json)?.status);
function ordersOf(json: Json): unknown[] | null {
  if (Array.isArray(json)) return json;
  if (!isObj(json)) return null;
  for (const k of ["orders", "data", "items", "results"]) if (Array.isArray(json[k])) return json[k] as unknown[];
  return Object.values(json).find(Array.isArray) ?? null;
}

/** Field types instead of values — for responses that hold real customers' details. */
function shape(v: unknown, depth = 0): unknown {
  if (Array.isArray(v)) return v.length === 0 ? [] : [shape(v[0], depth + 1), `(${v.length} items)`];
  if (isObj(v)) {
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, depth > 5 ? typeof x : shape(x, depth + 1)]),
    );
  }
  return v === null ? "null" : typeof v;
}

const SECRETISH = /key|token|secret|authorization|password/i;
let liveKey: string | null = null;
/** Values only for responses about this connection itself; anything credential-shaped is blanked. */
function redact(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(redact);
  if (isObj(v)) {
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, SECRETISH.test(k) ? "[redacted]" : redact(x)]),
    );
  }
  if (typeof v === "string" && liveKey && v.includes(liveKey)) return "[redacted]";
  return v;
}
const compact = (v: unknown) => JSON.stringify(v, null, 1).replace(/\n\s*/g, " ");

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

type Outcome = "PASS" | "FAIL" | "WARN" | "INFO" | "SKIP";
interface Line { outcome: Outcome; name: string; detail?: string }
const lines: Line[] = [];
const samples: Record<string, unknown> = {};

function note(outcome: Outcome, name: string, detail?: string) {
  lines.push({ outcome, name, detail });
  console.log(`${outcome.padEnd(4)}  ${name}${detail ? `\n      ${detail}` : ""}`);
}
/** A claim the docs make: failing it is a failure. */
const assert = (ok: boolean, name: string, detail?: string) => note(ok ? "PASS" : "FAIL", name, ok ? undefined : detail);
/** Ordinary HTTP behaviour the docs don't spell out: a mismatch is worth a look, not a failure. */
const expectOk = (ok: boolean, name: string, detail?: string) => note(ok ? "PASS" : "WARN", name, ok ? undefined : detail);

// ---------------------------------------------------------------------------
// HTTP — with the safety rails
// ---------------------------------------------------------------------------

interface Ctx { base: string; key: string | null; gapMs: number }
interface Reply { status: number; ms: number; json: Json; text: string }

/** The only POSTs this check may ever send. */
const WRITES_ALLOWED = [/^\/orders$/, /^\/orders\/[^/]+\/cancel$/];
/** A GET that is not purely a read: the label endpoint may assign an article first. */
const READS_BLOCKED = [/\/label(\?|$)/];

let lastCall = 0;
async function call(
  ctx: Ctx,
  method: "GET" | "POST",
  route: string,
  opts: { body?: unknown; key?: string | null } = {},
): Promise<Reply> {
  const pathOnly = route.split("?")[0];
  if (method === "POST" && !WRITES_ALLOWED.some((re) => re.test(pathOnly))) {
    throw new Error(`Blocked: POST ${pathOnly} is not allowed here — it would book, label or otherwise act on a real shipment.`);
  }
  if (method === "GET" && READS_BLOCKED.some((re) => re.test(route))) {
    throw new Error(`Blocked: GET ${pathOnly} is not allowed here.`);
  }

  const wait = ctx.gapMs - (Date.now() - lastCall);
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();

  const key = opts.key === undefined ? ctx.key : opts.key;
  const started = Date.now();
  const res = await fetch(ctx.base + route, {
    method,
    headers: {
      // A generic client name: the service sees a script, not a person.
      "User-Agent": "postbridge-contract-check/1.0",
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
      ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  let json: Json = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }

  if (res.status === 429) {
    throw new Error(`Rate limited (429) on ${method} ${pathOnly}. Retry-After: ${res.headers.get("retry-after") ?? "not given"}. Stopping rather than hammering it.`);
  }
  return { status: res.status, ms: Date.now() - started, json, text };
}
const is2xx = (r: Reply) => r.status >= 200 && r.status < 300;
const tag = (r: Reply) => `HTTP ${r.status}, ${r.ms} ms`;

// ---------------------------------------------------------------------------
// Stage: docs — does the page still say what this check assumes?
// ---------------------------------------------------------------------------

/** What the sample order below sends, as the dotted paths the docs table uses. */
const SENT_FIELDS = new Set([
  "externalOrderId", "shippingAddress", "shippingAddress.name", "shippingAddress.phone",
  "shippingAddress.fullAddress", "shippingAddress.pincode", "shippingAddress.city",
  "shippingAddress.state", "shippingAddress.country", "customer", "customer.name",
  "customer.phone", "products", "products[].sku", "products[].qty", "products[].unitPrice",
  "products[].productName", "payment.method", "remarks",
]);
/** The calls this check (and the shop's integration) depend on. */
const NEEDED_PATHS = [
  "/me", "/warehouses", "/orders", "/orders/{externalOrderId}",
  "/orders/{externalOrderId}/cancel", "/orders/{externalOrderId}/tracking",
];

async function stageDocs(docsUrl: string) {
  console.log("\n— docs page —");
  let html: string;
  try {
    const res = await fetch(docsUrl, { signal: AbortSignal.timeout(20_000), headers: { "User-Agent": "postbridge-contract-check/1.0" } });
    html = await res.text();
    if (!res.ok) return note("WARN", "docs page reachable", `HTTP ${res.status}`);
  } catch (err) {
    return note("WARN", "docs page reachable", err instanceof Error ? err.message : String(err));
  }
  note("PASS", "docs page reachable");

  // The page builds its tables from two inline arrays, so read them from there.
  const paths = [...html.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (paths.length === 0) return note("INFO", "docs page layout", "could not find the call list — the page may have been redesigned; compare it by eye");
  const missing = NEEDED_PATHS.filter((p) => !paths.includes(p));
  assert(missing.length === 0, "docs still list every call this integration uses", `missing from the page: ${missing.join(", ")}`);

  const table = html.match(/const CREATE_FIELDS = (\[[\s\S]*?\n {4}\]);/);
  let rows: string[][] | null = null;
  try { rows = table ? (JSON.parse(table[1]) as string[][]) : null; } catch { rows = null; }
  if (!rows) return note("INFO", "create-order field table", "could not read it from the page");

  const required = rows.filter((r) => r[1] === "Required").map((r) => r[0]);
  const unsent = required.filter((f) => !SENT_FIELDS.has(f));
  assert(unsent.length === 0, `every field the docs mark Required is in the sample order (${required.length} fields)`, `the docs now require: ${unsent.join(", ")}`);
  const oneOf = rows.filter((r) => r[1] === "One of three").map((r) => r[0]);
  note("INFO", "products need one identifier", `docs: ${oneOf.join(" / ")} — the sample sends products[].sku`);
}

// ---------------------------------------------------------------------------
// Stage: no key
// ---------------------------------------------------------------------------

async function stageNoKey(ctx: Ctx) {
  console.log("\n— no key —");
  const anon = await call(ctx, "GET", "/me", { key: null });
  expectOk([401, 403].includes(anon.status), "GET /me with no key is refused", `${tag(anon)}: ${anon.text.slice(0, 120)}`);
  note("INFO", "what a refusal looks like", `${tag(anon)} ${compact(anon.json ?? anon.text.slice(0, 120))}`);

  const wrong = await call(ctx, "GET", "/me", { key: "pb_live_not_a_real_key_0000" });
  expectOk([401, 403].includes(wrong.status), "GET /me with a wrong key is refused", `${tag(wrong)}: ${wrong.text.slice(0, 120)}`);
}

// ---------------------------------------------------------------------------
// Stage: read-only (needs the key)
// ---------------------------------------------------------------------------

async function stageRead(ctx: Ctx) {
  console.log("\n— read-only —");
  const me = await call(ctx, "GET", "/me");
  assert(me.status === 200, "GET /me accepts the connection key", `${tag(me)}: ${me.text.slice(0, 200)}`);
  if (me.status !== 200) return note("SKIP", "the rest of the read stage", "the key was not accepted");
  samples.me = redact(me.json);
  // The docs say this reply explains what happens when an order arrives — the
  // single most useful thing to read before wiring anything.
  note("INFO", "GET /me (the connection itself; credentials blanked)", compact(redact(me.json)));

  const wh = await call(ctx, "GET", "/warehouses");
  assert(wh.status === 200, "GET /warehouses works", `${tag(wh)}: ${wh.text.slice(0, 200)}`);
  const whList = ordersOf(wh.json);
  samples.warehouses = shape(wh.json);
  note("INFO", "warehouses", `${whList ? `${whList.length} found. ` : ""}shape: ${compact(shape(wh.json))}`);

  // Real customers' details live in this reply, so only its shape is kept.
  const list = await call(ctx, "GET", "/orders?limit=5");
  assert(list.status === 200, "GET /orders?limit=5 works", `${tag(list)}: ${list.text.slice(0, 200)}`);
  const items = ordersOf(list.json);
  if (items) assert(items.length <= 5, "limit=5 is respected", `got ${items.length} orders`);
  else note("INFO", "orders list", "could not find the array of orders in the reply");
  samples.orderList = shape(list.json);
  note("INFO", "order list shape (field types only — it holds real customers' details)", compact(shape(list.json)));

  const ghost = `TEST-DOES-NOT-EXIST-${Date.now().toString(36)}`;
  const gone = await call(ctx, "GET", `/orders/${ghost}`);
  expectOk(gone.status === 404, "an unknown order id gives 404", `${tag(gone)}: ${gone.text.slice(0, 120)}`);
  note("INFO", "what 'not found' looks like", `${tag(gone)} ${compact(gone.json ?? gone.text.slice(0, 120))}`);
}

// ---------------------------------------------------------------------------
// Stage: write (only with --write)
// ---------------------------------------------------------------------------

/** The sample order from the docs page, with a test id and one line per SKU. */
function sampleOrder(externalOrderId: string, skus: string[]) {
  return {
    externalOrderId,
    customer: { name: "PostBridge API Test", phone: "9876543210" },
    shippingAddress: {
      name: "PostBridge API Test",
      phone: "9876543210",
      fullAddress: "12 Sample Street",
      pincode: "682001",
      city: "Kochi",
      state: "Kerala",
      country: "India",
    },
    products: skus.map((sku) => ({ sku, qty: 1, unitPrice: 100, productName: "API test item" })),
    payment: { method: "COD" },
    remarks: "API test order - safe to cancel",
  };
}

async function stageWrite(ctx: Ctx, skus: string[], fakeSku: boolean, wait: boolean) {
  console.log("\n— write (creates TEST orders on the account, then cancels them) —");
  console.log("      This creates 2 real orders with ids starting TEST- and cancels both at the end.");
  console.log("      It never books, assigns a barcode or fetches a label.");
  if (wait) { console.log("      Starting in 6 seconds — Ctrl+C now to stop."); await sleep(6000); }

  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const id = `TEST-${stamp}-${Math.random().toString(36).slice(2, 6)}`;
  const badId = `${id}-BAD`;
  const created = new Set<string>();

  try {
    const payload = sampleOrder(id, skus);
    const first = await call(ctx, "POST", "/orders", { body: payload });
    if (is2xx(first)) created.add(id);
    assert(is2xx(first), "POST /orders saves the order", `${tag(first)}: ${first.text.slice(0, 300)}`);
    if (!is2xx(first)) return;
    samples.createOrder = first.json;
    note("INFO", `create reply (${tag(first)})`, compact(first.json));
    assert(idOf(first.json) === id, "the reply carries our externalOrderId back", `looked in order.externalOrderId and externalOrderId; reply: ${first.text.slice(0, 200)}`);

    const status = statusOf(first.json);
    if (fakeSku) assert(status === "Pending", "a product that is not in the catalogue saves as Pending", `status was ${JSON.stringify(status)}`);
    else note("INFO", `status for ${skus.length === 1 ? `the SKU ${skus[0]}` : `the ${skus.length} SKUs`}`, JSON.stringify(status));

    // Each line of the reply says whether PostBridge found the product: the live API
    // answers productID "UNMATCHED" for one it does not know. Sending every code in
    // one order tells the owner exactly which products still need adding there.
    const lines = orderOf(first.json)?.products;
    if (!fakeSku && Array.isArray(lines) && lines.some((l) => isObj(l) && typeof l.productID === "string")) {
      const missing = lines.filter((l) => isObj(l) && l.productID === "UNMATCHED").map((l) => String((l as Record<string, unknown>).sku));
      note(
        missing.length === 0 ? "PASS" : "WARN",
        `PostBridge's catalogue has ${lines.length - missing.length} of the ${lines.length} product code(s) sent`,
        missing.length > 0 ? `not in PostBridge's catalogue: ${missing.join(", ")}` : undefined,
      );
      samples.catalogueMissing = missing;
    }

    // The docs: "Send the same id again and PostBridge returns the existing order."
    const again = await call(ctx, "POST", "/orders", { body: payload });
    assert(is2xx(again) && idOf(again.json) === id, "sending the same externalOrderId again returns the same order", `${tag(again)}: ${again.text.slice(0, 200)}`);
    const all = await call(ctx, "GET", "/orders?limit=100");
    const seen = (ordersOf(all.json) ?? []).filter((o) => idOf(o) === id).length;
    if (ordersOf(all.json)) assert(seen === 1, "…and it did not create a duplicate", `${seen} orders carry that id`);

    const got = await call(ctx, "GET", `/orders/${id}`);
    assert(got.status === 200 && idOf(got.json) === id, "GET /orders/{id} finds it", `${tag(got)}: ${got.text.slice(0, 200)}`);

    // Required fields are listed as required; a missing pincode must not slip through.
    const noPin = sampleOrder(badId, skus.slice(0, 1));
    delete (noPin.shippingAddress as { pincode?: string }).pincode;
    const bad = await call(ctx, "POST", "/orders", { body: noPin });
    if (is2xx(bad)) created.add(badId);
    assert(bad.status >= 400 && bad.status < 500, "an order with no pincode is rejected", `${tag(bad)} — it was accepted: ${bad.text.slice(0, 200)}`);
    note("INFO", "what a rejected order looks like", `${tag(bad)} ${compact(bad.json ?? bad.text.slice(0, 200))}`);

    // Read-only: what does tracking say before anything is booked?
    const track = await call(ctx, "GET", `/orders/${id}/tracking`);
    expectOk(track.status < 500, "tracking on an unbooked order does not error", `${tag(track)}: ${track.text.slice(0, 200)}`);
    note("INFO", `tracking before booking (${tag(track)})`, compact(track.json ?? track.text.slice(0, 200)));
    samples.trackingUnbooked = track.json;
  } finally {
    await cleanUp(ctx, created);
  }
}

/** Cancels whatever was created and says plainly if anything could not be. */
async function cleanUp(ctx: Ctx, created: Set<string>) {
  if (created.size === 0) return;
  const stuck: string[] = [];
  for (const orderId of created) {
    try {
      const cancel = await call(ctx, "POST", `/orders/${orderId}/cancel`);
      if (!is2xx(cancel)) { stuck.push(orderId); note("FAIL", `cancel ${orderId}`, `${tag(cancel)}: ${cancel.text.slice(0, 200)}`); continue; }
      const after = await call(ctx, "GET", `/orders/${orderId}`);
      assert(statusOf(after.json) === "Cancelled", `${orderId} is Cancelled afterwards`, `status is ${JSON.stringify(statusOf(after.json))}`);
      if (statusOf(after.json) !== "Cancelled") stuck.push(orderId);
      else samples.cancelReply = cancel.json;
    } catch (err) {
      stuck.push(orderId);
      note("FAIL", `cancel ${orderId}`, err instanceof Error ? err.message : String(err));
    }
  }
  if (stuck.length > 0) {
    console.log(`\n!!  Could not confirm these test orders are cancelled — cancel them by hand in PostBridge:\n!!    ${stuck.join("\n!!    ")}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { values: args } = parseArgs({
    options: {
      mock: { type: "boolean" },
      "mock-shape": { type: "string" },
      "mock-fault": { type: "string" },
      write: { type: "boolean" },
      "no-wait": { type: "boolean" },
      sku: { type: "string" },
      skus: { type: "string" },
      base: { type: "string" },
      out: { type: "string" },
      help: { type: "boolean" },
    },
  });
  if (args.help) return console.log("See the comment at the top of scripts/postbridge/check.ts.");

  let mock: MockServer | null = null;
  let base = args.base ?? process.env.POSTBRIDGE_BASE_URL ?? DEFAULT_BASE;
  let key = process.env.POSTBRIDGE_API_KEY?.trim() || null;

  if (args.mock) {
    mock = await startMock({
      shape: args["mock-shape"] === "flat" ? "flat" : "wrapped",
      fault: args["mock-fault"] === "cancel" ? "cancel" : undefined,
    });
    base = mock.url;
    key = mock.key;
  }
  liveKey = key;

  const ctx: Ctx = { base, key, gapMs: args.mock ? 0 : 300 };
  console.log(`PostBridge contract check\n  target : ${args.mock ? "LOCAL STAND-IN (not the real API)" : base}`);
  console.log(`  key    : ${key ? `loaded (${key.length} characters, not shown)` : "not set — stages that need it will be skipped"}`);
  console.log(`  writes : ${args.write ? "ON (--write)" : "off"}`);

  const skuList = args.skus
    ? args.skus.split(",").map((s) => s.trim()).filter(Boolean)
    : [args.sku ?? "TEST-SKU-NOT-IN-CATALOGUE"];
  const fakeSku = !args.sku && !args.skus;

  try {
    if (!args.mock) await stageDocs(DOCS_URL);
    await stageNoKey(ctx);

    if (!key) {
      note("SKIP", "read-only and write stages", "no POSTBRIDGE_API_KEY — put it in web/.env.local");
    } else {
      await stageRead(ctx);
      if (args.write) await stageWrite(ctx, skuList, fakeSku, !args["no-wait"] && !args.mock);
      else note("SKIP", "write stage", "run with --write to create and cancel a TEST order");
    }

    // The safety rail itself, proven rather than assumed.
    for (const [m, p] of [["POST", "/orders/X/book"], ["POST", "/orders/X/barcode"], ["GET", "/orders/X/label"]] as const) {
      let blocked = false;
      try { await call(ctx, m, p); } catch (e) { blocked = e instanceof Error && e.message.startsWith("Blocked"); }
      assert(blocked, `guard: ${m} ${p} is refused by this script`, "it was sent");
    }
  } catch (err) {
    note("FAIL", "check stopped", err instanceof Error ? err.message : String(err));
  } finally {
    if (mock) {
      const touched = mock.requests.filter((r) => /\/(book|barcode|label)\b/.test(r));
      assert(touched.length === 0, "the stand-in never saw a book, barcode or label request", touched.join(", "));
      await mock.close();
    }
  }

  const out = args.out ?? path.join(tmpdir(), `postbridge-check-${Date.now()}.json`);
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), target: ctx.base, mock: !!args.mock, lines, samples }, null, 2));

  const n = (o: Outcome) => lines.filter((l) => l.outcome === o).length;
  console.log(`\n${n("PASS")} passed, ${n("FAIL")} failed, ${n("WARN")} to look at, ${n("SKIP")} skipped`);
  console.log(`Full record: ${out}`);
  process.exitCode = n("FAIL") > 0 ? 1 : 0;
}

main();
