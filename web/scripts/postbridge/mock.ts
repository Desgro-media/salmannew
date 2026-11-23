/**
 * A local stand-in for the PostBridge Partner API.
 *
 * Used two ways: in-process by `check.ts --mock`, to prove the contract check
 * works before it is pointed at a live account, and as a real server
 * (`mock-server.ts`) that the shop itself can be aimed at through
 * POSTBRIDGE_BASE_URL, to exercise the whole integration — sending, booking,
 * labels, tracking, and failures — without touching the real account.
 *
 * The default (`wrapped`) layout is the one observed on the live API: every reply
 * carries `success`, errors are { message }, an order is { orderID,
 * externalOrderId, status, products[{ productID: "UNMATCHED" | … }], articleId,
 * trackingLink, scans, labelAvailable, … }, and create answers
 * { success, duplicate, remark, order }. The rules come from the docs and from
 * those calls: required fields, the same externalOrderId returning the same
 * order, an unknown product saving as Pending, cancelling working, and a
 * Manifested order refusing to be cancelled.
 *
 * Two things are still guesses, because they only exist once a parcel has really
 * been booked: the shape of a scan, and the reply to /book. The `flat` layout
 * deliberately renames the fields, to keep the shop's code from quietly depending
 * on one spelling.
 *
 * Passing against this proves the code, never PostBridge.
 */

import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

export type MockFault = "create" | "book" | "cancel" | "tracking" | "label";

export interface MockOptions {
  /** `wrapped`: the live API's layout.  `flat`: the same facts under different field names. */
  shape: "wrapped" | "flat";
  /** Make one call fail. Can be changed while running, to prove failures are handled and recovered from. */
  fault?: MockFault;
  /** Listen here instead of on a free port — so a running app can be pointed at it. */
  port?: number;
}

export interface MockServer {
  url: string;
  key: string;
  /** "METHOD /route" for every API call received, so a test can prove what was never called. */
  requests: string[];
  setFault(fault: MockFault | null): void;
  close(): Promise<void>;
}

/** SKUs this stand-in "has in its catalogue". */
const CATALOGUE = new Set(["SP-IMP-020", "SP-IMP-050", "SP-ORC-020", "SP-ORC-050"]);

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** The docs' own list of what a new order must contain. */
function validate(body: unknown): string | null {
  if (!isObj(body)) return "Body must be a JSON object.";
  const id = body.externalOrderId;
  if (typeof id !== "string" || id.length < 1 || id.length > 80 || /[/?#]/.test(id)) {
    return "externalOrderId must be 1–80 characters with no / ? #.";
  }
  const address = body.shippingAddress;
  if (!isObj(address)) return "shippingAddress is required.";
  const missing = ["name", "phone", "fullAddress", "pincode", "city", "state"].filter((f) => !address[f]);
  if (missing.length > 0) return `Incomplete address. Missing: ${missing.map((f) => `shippingAddress.${f}`).join(", ")}`;
  const products = body.products;
  if (!Array.isArray(products) || products.length === 0) return "products needs at least one line.";
  for (const p of products) {
    if (!isObj(p) || !(p.productID || p.sku || p.externalProductId)) {
      return "each product needs productID, sku or externalProductId.";
    }
    if (!(typeof p.qty === "number" && p.qty > 0)) return "qty must be greater than 0.";
  }
  const method = isObj(body.payment) ? body.payment.method : body.payment_mode;
  if (!["COD", "Pre-paid", "Direct"].includes(String(method))) {
    return "payment.method must be COD, Pre-paid or Direct.";
  }
  return null;
}

interface MockScan {
  date: string;
  status: string;
  location: string;
}

/** An order as the live API shows it (see the header). */
type MockOrder = Record<string, unknown> & {
  externalOrderId: string;
  status: string;
  articleId: string | null;
  trackingLink: string | null;
  scans: MockScan[];
};

export async function startMock(opts: MockOptions): Promise<MockServer> {
  const key = "pb_mock_0000";
  const orders = new Map<string, MockOrder>(); // oldest first
  let requests: string[] = [];
  let fault: MockFault | null = opts.fault ?? null;
  let articles = 0;
  let serial = 450000;

  /** `flat` keeps every fact but spells the article and tracking fields differently. */
  const show = (o: MockOrder): unknown => {
    if (opts.shape === "wrapped") return o;
    const { articleId, trackingLink: _link, scans: _scans, ...rest } = o;
    void _link;
    void _scans;
    return { ...rest, barcode: articleId };
  };
  const wrapOrder = (o: MockOrder, extra: Record<string, unknown> = {}) =>
    opts.shape === "wrapped" ? { success: true, ...extra, order: show(o) } : { success: true, ...extra, ...(show(o) as object) };
  const wrapList = (os: MockOrder[]) =>
    opts.shape === "wrapped"
      ? { success: true, orders: os.map(show), nextCursor: null }
      : { success: true, data: os.map(show) };

  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      const send = (status: number, body: unknown) => {
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(body));
      };

      const url = new URL(req.url ?? "/", "http://localhost");
      const method = req.method ?? "GET";

      let body: unknown = null;
      try {
        if (chunks.length) body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        return send(400, { message: "Body is not valid JSON." });
      }

      // Not part of the real API: lets a test see state, and break things on purpose.
      if (url.pathname.startsWith("/__control")) {
        if (url.pathname === "/__control/state") return send(200, { orders: [...orders.values()], requests });
        if (url.pathname === "/__control/fault" && method === "POST") {
          fault = isObj(body) && typeof body.fault === "string" ? (body.fault as MockFault) : null;
          return send(200, { fault });
        }
        if (url.pathname === "/__control/reset" && method === "POST") {
          orders.clear();
          requests = [];
          fault = null;
          return send(200, { reset: true });
        }
        return send(404, { message: "No such control." });
      }

      const route = url.pathname.replace(/^\/api\/v1/, "") || "/";
      requests.push(`${method} ${route}`);

      if (req.headers.authorization !== `Bearer ${key}`) {
        return send(401, { message: "Invalid or missing connection key." });
      }

      if (method === "GET" && route === "/me") {
        return send(200, {
          success: true,
          connectionId: "pcon_standin",
          name: "Stand-in",
          scopes: ["orders:write", "orders:read", "orders:cancel", "orders:book", "tracking:read", "label:read"],
          assignBarcodeOnCreate: false,
          bookOnCreate: false,
          onCreateAction: "create",
          webhookConfigured: false,
        });
      }

      if (method === "GET" && route === "/warehouses") {
        return send(200, {
          success: true,
          warehouses: [{ warehouseId: "wh_1", name: "Main warehouse", city: "Kochi", pin: "682001", isDefault: true }],
        });
      }

      if (route === "/orders" && method === "POST") {
        if (fault === "create") return send(500, { message: "Stand-in fault: create is broken." });
        const problem = validate(body);
        if (problem) return send(400, { message: problem, remark: problem });
        const input = body as Record<string, unknown>;
        const id = input.externalOrderId as string;

        const existing = orders.get(id);
        if (existing) return send(200, wrapOrder(existing, { duplicate: true, remark: input.remarks ?? null }));

        const lines = input.products as Record<string, unknown>[];
        const known = lines.every((p) => CATALOGUE.has(String(p.sku ?? p.externalProductId ?? p.productID)));
        const payment = isObj(input.payment) ? input.payment : { method: input.payment_mode };
        const now = new Date().toISOString();
        const order: MockOrder = {
          orderID: String(++serial),
          externalOrderId: id,
          status: known ? "Order Placed" : "Pending",
          remarks: input.remarks ?? null,
          customer: input.customer ?? null,
          shippingAddress: input.shippingAddress,
          products: lines.map((p) => ({
            productID: CATALOGUE.has(String(p.sku)) ? `PB-${String(p.sku)}` : "UNMATCHED",
            productName: p.productName ?? null,
            sku: p.sku ?? null,
            externalProductId: p.externalProductId ?? null,
            qty: p.qty,
            unitPrice: p.unitPrice ?? null,
            total: typeof p.qty === "number" && typeof p.unitPrice === "number" ? p.qty * p.unitPrice : null,
          })),
          payment: { method: payment.method, status: payment.method === "COD" ? "COD" : "Paid" },
          amount: input.amount ?? null,
          deliveryCharge: input.deliveryCharge ?? 0,
          totalOrderValue: input.totalOrderValue ?? null,
          warehouseId: null,
          package: { weightGrams: isObj(input.shipment) ? (input.shipment.weightGrams ?? null) : null, length: 20, breadth: 15, height: 2 },
          articleId: null,
          courier: null,
          trackingLink: null,
          scans: [],
          labelAvailable: false,
          createdAt: now,
          updatedAt: now,
        };
        orders.set(id, order);
        return send(201, wrapOrder(order, { duplicate: false, remark: order.remarks }));
      }

      if (route === "/orders" && method === "GET") {
        const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);
        return send(200, wrapList([...orders.values()].reverse().slice(0, limit)));
      }

      const one = route.match(/^\/orders\/([^/]+)(\/cancel|\/tracking|\/book|\/label)?$/);
      if (one) {
        const order = orders.get(decodeURIComponent(one[1]));
        if (!order) return send(404, { message: "Order not found" });
        const action = one[2];

        if (!action && method === "GET") return send(200, wrapOrder(order));

        if (action === "/tracking" && method === "GET") {
          if (fault === "tracking") return send(500, { message: "Stand-in fault: tracking is broken." });
          if (opts.shape === "wrapped") {
            return send(200, {
              success: true,
              externalOrderId: order.externalOrderId,
              orderID: order.orderID,
              status: order.status,
              articleId: order.articleId,
              trackingLink: order.trackingLink,
              scans: order.scans,
            });
          }
          return send(200, {
            success: true,
            tracking: {
              barcode: order.articleId,
              link: order.trackingLink,
              events: order.scans.map((s) => ({ timestamp: s.date, description: s.status, office: s.location })),
            },
          });
        }

        if (action === "/book" && method === "POST") {
          if (fault === "book") return send(500, { message: "Stand-in fault: booking is broken." });
          if (order.status === "Cancelled") return send(409, { message: "Order is cancelled." });
          if (order.status === "Manifested") return send(409, { message: "Order is already manifested." });
          if (order.status === "Pending") return send(409, { message: "Order has products that are not in the catalogue." });
          articles += 1;
          order.articleId = `EB${String(100000000 + articles)}IN`;
          order.trackingLink = `https://stand-in.example/track/${order.articleId}`;
          order.courier = "India Post";
          order.labelAvailable = true;
          order.status = "Manifested";
          order.updatedAt = new Date().toISOString();
          order.scans = [
            { date: "2026-11-23T09:30:00+05:30", status: "Item booked", location: "Kochi HO" },
            { date: "2026-11-23T14:05:00+05:30", status: "Item dispatched", location: "Kochi Sorting Office" },
          ];
          return send(200, wrapOrder(order, { remark: "Manifested" }));
        }

        if (action === "/label" && method === "GET") {
          if (fault === "label") return send(500, { message: "Stand-in fault: labels are broken." });
          if (order.articleId === null) return send(409, { message: "Order has no article yet." });
          res.writeHead(200, { "content-type": "application/pdf" });
          return res.end(Buffer.from(`%PDF-1.4\n% stand-in label for ${order.articleId}\n%%EOF\n`));
        }

        if (action === "/cancel" && method === "POST") {
          if (fault === "cancel") return send(500, { message: "Stand-in fault: cancelling is broken." });
          if (order.status === "Manifested") return send(409, { message: "Already manifested; it cannot be cancelled here." });
          order.status = "Cancelled";
          order.remarks = "Cancelled";
          order.updatedAt = new Date().toISOString();
          return send(200, wrapOrder(order, { remark: "Cancelled" }));
        }
      }

      return send(404, { message: "No such route." });
    });
  });

  await new Promise<void>((resolve) => server.listen(opts.port ?? 0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}/api/v1`,
    key,
    get requests() {
      return requests;
    },
    setFault(next) {
      fault = next;
    },
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
