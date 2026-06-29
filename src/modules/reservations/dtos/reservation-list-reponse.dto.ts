import { RoomType, User } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/client";

export interface Reservation {
  id: string;

  checkIn: Date;
  checkOut: Date;

  roomCount: number;

  adults: number;
  children: number;
  babies: number;

  status: "PENDING" | "CONFIRMED" | "CANCELLED";

  totalPrice: Decimal;

  basePrice: Decimal;

  extraFee: Decimal;

  discount: number;

  countryCode?: string;
  phoneNumber?: string;

  confirmationNumber?: string;

  createdAt: Date;

  updatedAt: Date;

  roomType: RoomType;

  user?: User;
}