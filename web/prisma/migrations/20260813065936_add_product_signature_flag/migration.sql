-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "signature" BOOLEAN NOT NULL DEFAULT false;

-- The shop's Signature Collection filter used to be computed as "every scent
-- that isn't Privé". Carrying that forward as the starting value keeps the
-- filter showing what it showed yesterday; without it the column defaults to
-- false everywhere and the filter comes back empty until someone re-ticks all
-- six by hand. New products default to false and are opted in from the admin.
UPDATE "Product" SET "signature" = true WHERE "category" <> 'Prive';
