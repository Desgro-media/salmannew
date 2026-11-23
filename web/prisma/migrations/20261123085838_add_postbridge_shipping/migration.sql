-- CreateEnum
CREATE TYPE "PostbridgeSync" AS ENUM ('NOT_SENT', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "postbridgeError" TEXT,
ADD COLUMN     "postbridgeStatus" TEXT,
ADD COLUMN     "postbridgeSync" "PostbridgeSync" NOT NULL DEFAULT 'NOT_SENT',
ADD COLUMN     "postbridgeSyncedAt" TIMESTAMP(3),
ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "trackingUrl" TEXT;

-- CreateIndex
CREATE INDEX "Order_postbridgeSync_idx" ON "Order"("postbridgeSync");
