CREATE TYPE "DrawingPageRegionKind" AS ENUM ('GRID', 'TITLE_BLOCK');
CREATE TYPE "DrawingPageRegionStatus" AS ENUM ('PENDING', 'AVAILABLE', 'FAILED');

CREATE TABLE "drawing_page_regions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" "DrawingPageRegionKind" NOT NULL,
    "version" TEXT NOT NULL,
    "status" "DrawingPageRegionStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "dpi" INTEGER NOT NULL,
    "pixelWidth" INTEGER NOT NULL,
    "pixelHeight" INTEGER NOT NULL,
    "imagePath" TEXT,
    "imageName" TEXT,
    "pageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drawing_page_regions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "drawing_page_regions_pageId_key_key"
ON "drawing_page_regions"("pageId", "key");

CREATE INDEX "drawing_page_regions_pageId_status_idx"
ON "drawing_page_regions"("pageId", "status");

ALTER TABLE "drawing_page_regions"
ADD CONSTRAINT "drawing_page_regions_pageId_fkey"
FOREIGN KEY ("pageId") REFERENCES "drawing_pages"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
