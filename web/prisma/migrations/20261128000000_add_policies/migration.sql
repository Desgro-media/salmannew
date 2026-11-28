-- CreateTable
CREATE TABLE "Policy" (
    "slug" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "summary" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("slug")
);
