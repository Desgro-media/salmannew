-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "shippingFee" INTEGER NOT NULL DEFAULT 50,
    "freeShippingThreshold" INTEGER NOT NULL DEFAULT 2999,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- One row, enforced by the database rather than by every caller remembering to
-- pass id = 1. A second row would become a second set of delivery charges, and
-- which one applied would depend on query order.
ALTER TABLE "StoreSettings" ADD CONSTRAINT "StoreSettings_singleton" CHECK ("id" = 1);

-- Seed it, so the storefront reads real configuration from the first request
-- rather than falling back to the defaults compiled into the app. The delivery
-- charge starts at the ₹50 the shop is switching to; the free-delivery
-- threshold keeps the ₹2,999 the site has been advertising all along.
INSERT INTO "StoreSettings" ("id", "shippingFee", "freeShippingThreshold", "updatedAt")
VALUES (1, 50, 2999, CURRENT_TIMESTAMP);
