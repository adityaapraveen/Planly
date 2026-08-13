CREATE TYPE "SheetReferenceType" AS ENUM ('DETAIL', 'SECTION', 'ELEVATION', 'SCHEDULE', 'PLAN', 'GENERAL', 'OTHER');
CREATE TYPE "SheetReferenceResolution" AS ENUM ('RESOLVED', 'MISSING_TARGET', 'AMBIGUOUS_TARGET', 'LOW_CONFIDENCE');

CREATE TABLE "sheet_references" (
    "id" TEXT NOT NULL,
    "referenceType" "SheetReferenceType" NOT NULL,
    "label" TEXT NOT NULL,
    "detailNumber" TEXT,
    "targetSheetNumber" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "evidence" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "hasLocation" BOOLEAN NOT NULL DEFAULT true,
    "resolutionStatus" "SheetReferenceResolution" NOT NULL,
    "metadataVersion" TEXT NOT NULL DEFAULT 'sheet-reference-v1',
    "sourcePageId" TEXT NOT NULL,
    "targetSheetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sheet_references_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sheet_references_sourcePageId_idx" ON "sheet_references"("sourcePageId");
CREATE INDEX "sheet_references_targetSheetId_idx" ON "sheet_references"("targetSheetId");
CREATE INDEX "sheet_references_resolutionStatus_idx" ON "sheet_references"("resolutionStatus");
CREATE INDEX "sheet_references_targetSheetNumber_idx" ON "sheet_references"("targetSheetNumber");

ALTER TABLE "sheet_references"
ADD CONSTRAINT "sheet_references_sourcePageId_fkey"
FOREIGN KEY ("sourcePageId") REFERENCES "drawing_pages"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sheet_references"
ADD CONSTRAINT "sheet_references_targetSheetId_fkey"
FOREIGN KEY ("targetSheetId") REFERENCES "sheets"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
