/*
  Warnings:

  - You are about to drop the column `guestsCount` on the `Reservation` table. All the data in the column will be lost.
  - Added the required column `adults` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `babies` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `children` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `Reservation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxCapacity` to the `RoomType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `normalCapacity` to the `RoomType` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Reservation_roomTypeId_checkIn_checkOut_idx";

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "guestsCount",
ADD COLUMN     "adults" INTEGER NOT NULL,
ADD COLUMN     "babies" INTEGER NOT NULL,
ADD COLUMN     "children" INTEGER NOT NULL,
ADD COLUMN     "totalPrice" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "RoomType" ADD COLUMN     "maxCapacity" INTEGER NOT NULL,
ADD COLUMN     "normalCapacity" INTEGER NOT NULL;
