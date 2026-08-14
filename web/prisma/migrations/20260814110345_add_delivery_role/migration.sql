-- AlterEnum
ALTER TYPE "AdminRole" ADD VALUE 'DELIVERY';

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "name" TEXT;
