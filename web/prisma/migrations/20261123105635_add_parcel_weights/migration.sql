-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "postbridgeWeightGrams" INTEGER;

-- AlterTable
ALTER TABLE "ProductSize" ADD COLUMN     "weightGrams" INTEGER;

-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "packingGrams" INTEGER NOT NULL DEFAULT 50;
