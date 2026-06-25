-- AlterTable
ALTER TABLE "Facility" ADD COLUMN     "ownerId" TEXT;

-- CreateIndex
CREATE INDEX "Facility_ownerId_idx" ON "Facility"("ownerId");

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
