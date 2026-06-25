-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('pending', 'granted', 'revoked');

-- CreateTable
CREATE TABLE "RecordConsent" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecordConsent_patientId_idx" ON "RecordConsent"("patientId");

-- CreateIndex
CREATE INDEX "RecordConsent_doctorId_idx" ON "RecordConsent"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "RecordConsent_patientId_doctorId_key" ON "RecordConsent"("patientId", "doctorId");

-- AddForeignKey
ALTER TABLE "RecordConsent" ADD CONSTRAINT "RecordConsent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordConsent" ADD CONSTRAINT "RecordConsent_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
