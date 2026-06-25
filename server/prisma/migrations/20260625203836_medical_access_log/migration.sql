-- CreateTable
CREATE TABLE "MedicalAccessLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicalAccessLog_patientId_idx" ON "MedicalAccessLog"("patientId");

-- CreateIndex
CREATE INDEX "MedicalAccessLog_actorId_idx" ON "MedicalAccessLog"("actorId");
