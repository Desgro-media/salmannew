-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('RECEIVED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');

-- AlterTable
-- Converts Order.status from text to the enum in place. Written by hand because
-- Prisma's generated plan drops and recreates the column, which would reset the
-- stage of every order already in flight back to RECEIVED. Values are matched
-- case-insensitively so the existing lowercase 'received' rows carry over.
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Order"
  ALTER COLUMN "status" TYPE "OrderStatus"
  USING (
    CASE upper(trim("status"))
      WHEN 'RECEIVED' THEN 'RECEIVED'
      WHEN 'PACKED' THEN 'PACKED'
      WHEN 'SHIPPED' THEN 'SHIPPED'
      WHEN 'OUT_FOR_DELIVERY' THEN 'OUT_FOR_DELIVERY'
      WHEN 'DELIVERED' THEN 'DELIVERED'
      WHEN 'CANCELLED' THEN 'CANCELLED'
      ELSE 'RECEIVED'
    END
  )::"OrderStatus";

ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'RECEIVED';

-- CreateTable
CREATE TABLE "OrderStatusEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderStatusEvent_orderId_createdAt_idx" ON "OrderStatusEvent"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- AddForeignKey
ALTER TABLE "OrderStatusEvent" ADD CONSTRAINT "OrderStatusEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusEvent" ADD CONSTRAINT "OrderStatusEvent_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill
-- Orders that predate this feature have no event log, so their timeline would
-- render empty. Give each one the RECEIVED checkpoint, dated from the order
-- itself, plus its current stage if it had already moved past RECEIVED.
INSERT INTO "OrderStatusEvent" ("id", "orderId", "status", "createdAt")
SELECT
  'seed_' || replace(gen_random_uuid()::text, '-', ''),
  o."id",
  'RECEIVED'::"OrderStatus",
  o."createdAt"
FROM "Order" o;

INSERT INTO "OrderStatusEvent" ("id", "orderId", "status", "createdAt")
SELECT
  'seed_' || replace(gen_random_uuid()::text, '-', ''),
  o."id",
  o."status",
  o."createdAt" + interval '1 second'
FROM "Order" o
WHERE o."status" <> 'RECEIVED'::"OrderStatus";
