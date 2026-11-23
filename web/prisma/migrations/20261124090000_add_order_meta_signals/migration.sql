-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "checkoutUrl" TEXT,
ADD COLUMN     "clientIp" TEXT,
ADD COLUMN     "clientUserAgent" TEXT,
ADD COLUMN     "metaFbc" TEXT,
ADD COLUMN     "metaFbp" TEXT;
