/*
  Warnings:

  - A unique constraint covering the columns `[confirmationNumber]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "confirmationNumber" TEXT,
ADD COLUMN     "countryCode" TEXT,
ADD COLUMN     "phoneNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_confirmationNumber_key" ON "Reservation"("confirmationNumber");

-- CreateIndex
CREATE INDEX "Reservation_confirmationNumber_idx" ON "Reservation"("confirmationNumber");
