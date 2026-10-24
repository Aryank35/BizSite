-- CreateTable
CREATE TABLE "website_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "businessName" TEXT NOT NULL,
    "category" TEXT,
    "message" TEXT,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "website_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "website_requests_createdAt_idx" ON "website_requests"("createdAt");
