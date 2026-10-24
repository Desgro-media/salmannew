import { sendEmail } from "@/lib/brevo";

export interface PaidOrderSummary {
  orderNumber: string;
  subtotal: number;
  shipping: number;
  total: number;
  customerFullName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerPincode: string;
  items: { name: string; sizeLabel: string; quantity: number; price: number }[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Tells the store owner a real order came in. Called from markOrderPaid(),
 * only on the transition into PAID — never for a PENDING checkout someone
 * abandoned or a payment that failed.
 *
 * Best-effort: a Brevo outage or an unset API key must never fail the payment
 * confirmation the customer is waiting on, so every failure here is caught and
 * logged by the caller, never re-thrown into the checkout path.
 *
 * The recipient is ORDER_NOTIFY_EMAIL, a dedicated inbox — deliberately not
 * tied to whoever holds the SUPERADMIN admin-dashboard login, so changing one
 * never silently changes the other.
 */
export async function notifyOwnerOfPaidOrder(order: PaidOrderSummary): Promise<void> {
  const recipient = process.env.ORDER_NOTIFY_EMAIL;

  if (!recipient) {
    console.error("[email] ORDER_NOTIFY_EMAIL is not set, skipping order notification for", order.orderNumber);
    return;
  }

  const itemRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:4px 12px 4px 0;">${item.quantity} × ${escapeHtml(item.name)} (${escapeHtml(item.sizeLabel)})</td>
          <td style="padding:4px 0;text-align:right;">₹${item.price * item.quantity}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:sans-serif;font-size:14px;color:#1a1a1a;">
      <h2 style="margin:0 0 4px;">New order — ${escapeHtml(order.orderNumber)}</h2>
      <p style="margin:0 0 16px;">${escapeHtml(order.customerFullName)} just paid <strong>₹${order.total}</strong>.</p>

      <table style="border-collapse:collapse;width:100%;max-width:420px;">
        ${itemRows}
        <tr><td style="padding:8px 12px 0 0;">Subtotal</td><td style="padding:8px 0 0;text-align:right;">₹${order.subtotal}</td></tr>
        <tr><td style="padding:2px 12px 0 0;">Shipping</td><td style="padding:2px 0 0;text-align:right;">₹${order.shipping}</td></tr>
        <tr><td style="padding:4px 12px 0 0;font-weight:bold;">Total</td><td style="padding:4px 0 0;text-align:right;font-weight:bold;">₹${order.total}</td></tr>
      </table>

      <h3 style="margin:20px 0 4px;">Ship to</h3>
      <p style="margin:0;line-height:1.5;">
        ${escapeHtml(order.customerFullName)}<br/>
        ${escapeHtml(order.customerAddress)}<br/>
        ${escapeHtml(order.customerCity)}, ${escapeHtml(order.customerState)} ${escapeHtml(order.customerPincode)}<br/>
        ${escapeHtml(order.customerPhone)} · ${escapeHtml(order.customerEmail)}
      </p>
    </div>
  `;

  await sendEmail({
    to: [{ email: recipient }],
    subject: `New order ${order.orderNumber} — ₹${order.total}`,
    html,
  });
}
