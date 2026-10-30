import type {
  PaymentMethod as PrismaPaymentMethod,
  PaymentStatus as PrismaPaymentStatus,
} from "@prisma/client";

export type PaymentStatus = PrismaPaymentStatus;
export type PaymentMethod = PrismaPaymentMethod;

/**
 * Mirrors Prisma's PaymentStatus as plain strings, for the same reason
 * order-status.ts mirrors OrderStatus: re-exporting the generated enum would be
 * a runtime dependency on the client, which is undefined before `prisma
 * generate` and cannot be bundled for the browser.
 *
 * `satisfies` makes a schema change that adds or drops a member a compile
 * error here rather than a silently missing label.
 */
export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  COD_PENDING: "COD_PENDING",
} as const satisfies Record<PrismaPaymentStatus, PrismaPaymentStatus>;

/** Admin-facing wording — says what happened to the money, not to the parcel. */
export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Awaiting payment",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
  COD_PENDING: "Cash due on delivery",
};

export const PaymentMethod = {
  ONLINE: "ONLINE",
  COD: "COD",
} as const satisfies Record<PrismaPaymentMethod, PrismaPaymentMethod>;

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  ONLINE: "Online (Razorpay)",
  COD: "Cash on delivery",
};
