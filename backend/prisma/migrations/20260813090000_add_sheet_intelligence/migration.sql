CREATE TYPE "SheetReviewStatus" AS ENUM ('AI_EXTRACTED', 'NEEDS_REVIEW', 'CORRECTED', 'CONFIRMED');

CREATE TABLE "sheets" (
    "id" TEXT NOT NULL,
    "sheetNumber" TEXT,
    "title" TEXT,
    "discipline" TEXT,
    "revision" TEXT,
    "issueDate" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fieldConfidence" JSONB NOT NULL,
    "evidence" JSONB NOT NULL,
    "titleBlockLocation" JSONB,
    "reviewStatus" "SheetReviewStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
    "metadataVersion" TEXT NOT NULL DEFAULT 'v1',
    "correctedAt" TIMESTAMP(3),
    "pageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sheets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sheets_pageId_key" ON "sheets"("pageId");
CREATE INDEX "sheets_sheetNumber_idx" ON "sheets"("sheetNumber");
CREATE INDEX "sheets_reviewStatus_idx" ON "sheets"("reviewStatus");

ALTER TABLE "sheets"
ADD CONSTRAINT "sheets_pageId_fkey"
FOREIGN KEY ("pageId") REFERENCES "drawing_pages"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
