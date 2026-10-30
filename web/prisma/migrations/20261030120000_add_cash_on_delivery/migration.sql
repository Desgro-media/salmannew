-- Cash on delivery.
--
-- Every column is additive with a default, so existing orders and the existing
-- settings row are valid as they stand: all current orders read as ONLINE with
-- no COD fee, and the settings row picks up "COD on, no fee, up to 5,000 rupees".

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'COD');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'COD_PENDING';

-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "codEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "codFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "codMaxOrderValue" INTEGER NOT NULL DEFAULT 5000;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "codFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'ONLINE';
