import { AuthProvider, Notification, Reservation, RoomInventory, UserRole } from "@prisma/client";


export class UserResponseDto {
  id: string;

  email: string;

  name: string | null;

  provider: AuthProvider;

  profileImageUrl: string | null;

  role: UserRole;

  createdAt: Date;

  updatedAt: Date;

  reservations?: Reservation[];

  notificationReads?: Notification[];

  createdInventories?: RoomInventory[];
}