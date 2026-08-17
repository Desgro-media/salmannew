-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT;

-- Every order that already exists predates payments: it was placed through the
-- old checkout, which took no money but did produce a real order somebody is
-- expecting. The column default of PENDING is right for new rows and wrong for
-- these — left alone, the whole existing order history would drop out of the
-- admin queue and every customer's tracking page the moment this deploys.
--
-- Marked PAID rather than given a new state because that is what the business
-- treated them as. paidAt stays null, which is the honest record: no payment
-- was ever captured for them and none can be reconciled against Razorpay.
UPDATE "Order" SET "paymentStatus" = 'PAID';

-- CreateIndex
CREATE UNIQUE INDEX "Order_razorpayOrderId_key" ON "Order"("razorpayOrderId");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
