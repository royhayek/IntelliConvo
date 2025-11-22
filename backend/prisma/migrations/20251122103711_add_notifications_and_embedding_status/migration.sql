-- CreateEnum
CREATE TYPE "UrlEmbeddingStatus" AS ENUM ('SCRAPED', 'PENDING', 'PROCESSING', 'READY', 'FAILED', 'EXCLUDED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CrawlStatus" ADD VALUE 'AWAITING_PAYMENT';
ALTER TYPE "CrawlStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "CrawlStatus" ADD VALUE 'READY';
ALTER TYPE "CrawlStatus" ADD VALUE 'PARTIAL';

-- AlterTable
ALTER TABLE "SiteUrl" ADD COLUMN     "embeddingStatus" "UrlEmbeddingStatus" NOT NULL DEFAULT 'SCRAPED';

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "siteId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "SiteUrl_embeddingStatus_idx" ON "SiteUrl"("embeddingStatus");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
