-- CreateTable
CREATE TABLE "drawing_pages" (
    "id" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "imagePath" TEXT NOT NULL,
    "imageName" TEXT NOT NULL,
    "drawingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drawing_pages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "drawing_pages" ADD CONSTRAINT "drawing_pages_drawingId_fkey" FOREIGN KEY ("drawingId") REFERENCES "drawings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
