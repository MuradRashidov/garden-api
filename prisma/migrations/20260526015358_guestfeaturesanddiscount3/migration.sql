/*
  Warnings:

  - Added the required column `basePrice` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "basePrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "discount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "extraFee" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Reservation_roomTypeId_idx" ON "Reservation"("roomTypeId");

-- CreateIndex
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");
