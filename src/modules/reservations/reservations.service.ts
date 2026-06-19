import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma/prisma.service';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { UpdateReservationDto } from './dtos/update-reservation.dto';
import { NotificationType } from '@prisma/client';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}
  async getAllReservations() {
    return this.prisma.reservation.findMany({
      include: {
        user: true,
        roomType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  async getMyReservations(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      include: {
        roomType: true,
      },
    });
  }
  // async createReservation(
  //   data: CreateReservationDto & { userId: string },
  // ) {
  //   // =========================
  //   // ROOM TYPE FETCH
  //   // =========================
  //   const roomType = await this.prisma.roomType.findUnique({
  //     where: { id: data.roomTypeId },
  //     include: { reservations: true },
  //   });

  //   if (!roomType) {
  //     throw new NotFoundException('Room type not found');
  //   }

  //   // =========================
  //   // DATE VALIDATION
  //   // =========================
  //   const start = new Date(data.checkIn);
  //   const end = new Date(data.checkOut);

  //   if (start >= end) {
  //     throw new BadRequestException(
  //       'Check-out must be after check-in',
  //     );
  //   }

  //   // =========================
  //   // OVERLAP CHECK
  //   // =========================
  //   const overlappingReservations = roomType.reservations.filter(
  //     (reservation) =>
  //       reservation.status !== 'CANCELLED' &&
  //       reservation.checkIn < end &&
  //       reservation.checkOut > start,
  //   );

  //   const bookedRooms = overlappingReservations.reduce(
  //     (sum, reservation) => sum + reservation.roomCount,
  //     0,
  //   );

  //   const availableCount =
  //     roomType.totalCount - bookedRooms;

  //   if (availableCount < data.roomCount) {
  //     throw new BadRequestException(
  //       `Only ${availableCount} rooms available. You requested ${data.roomCount}.`,
  //     );
  //   }

  //   // =========================
  //   // GUEST VALIDATION
  //   // =========================
  //   const countedGuests = data.adults + data.children;

  //   if (countedGuests > roomType.maxCapacity) {
  //     throw new BadRequestException(
  //       `Maximum allowed guests is ${roomType.maxCapacity}.`,
  //     );
  //   }

  //   // =========================
  //   // EXTRA GUEST LOGIC
  //   // =========================
  //   const extraGuests = Math.max(
  //     countedGuests - roomType.normalCapacity,
  //     0,
  //   );

  //   const extraChildren = Math.min(
  //     data.children,
  //     extraGuests,
  //   );

  //   const extraAdults = extraGuests - extraChildren;

  //   const childExtraPrice = extraChildren * 26.3;
  //   const adultExtraPrice = extraAdults * 41.3;

  //   const extraFee = childExtraPrice + adultExtraPrice;

  //   // =========================
  //   // PRICING BASE
  //   // =========================
  //   const basePrice = Number(roomType.price);

  //   const nights = Math.ceil(
  //     (end.getTime() - start.getTime()) /
  //       (1000 * 60 * 60 * 24),
  //   );

  //   // =========================
  //   // SUBTOTAL
  //   // =========================
  //   const subtotal =
  //     (basePrice + extraFee) *
  //     nights *
  //     data.roomCount;

  //   // =========================
  //   // DISCOUNT SNAPSHOT
  //   // =========================
  //   const discountPercent =
  //     roomType.discountPercent || 0;

  //   const discountAmount =
  //     (subtotal * discountPercent) / 100;

  //   const totalPrice =
  //     subtotal - discountAmount;

  //   // =========================
  //   // CREATE RESERVATION (NEW MODEL)
  //   // =========================
  //   return this.prisma.reservation.create({
  //     data: {
  //       userId: data.userId,
  //       roomTypeId: data.roomTypeId,

  //       checkIn: start,
  //       checkOut: end,

  //       roomCount: data.roomCount,
  //       adults: data.adults,
  //       children: data.children,
  //       babies: data.babies,

  //       // 💰 NEW FIELDS
  //       basePrice: basePrice,
  //       extraFee: extraFee,
  //       discount: discountPercent,
  //       totalPrice: totalPrice,
  //     },
  //   });
  // }
  async createReservation(data: CreateReservationDto & { userId: string }) {
    // =========================
    // ROOM TYPE
    // =========================
    const roomType = await this.prisma.roomType.findUnique({
      where: {
        id: data.roomTypeId,
      },
    });

    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }

    // =========================
    // DATES
    // =========================
    const start = new Date(data.checkIn);
    const end = new Date(data.checkOut);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid dates');
    }

    if (start >= end) {
      throw new BadRequestException('Check-out must be after check-in');
    }

    // =========================
    // ALL OVERLAPPING RESERVATIONS
    // =========================
    const reservations = await this.prisma.reservation.findMany({
      where: {
        roomTypeId: data.roomTypeId,
        status: {
          not: 'CANCELLED',
        },
        checkIn: {
          lt: end,
        },
        checkOut: {
          gt: start,
        },
      },
    });

    // =========================
    // INVENTORY BLOCKS
    // =========================
    const inventories = await this.prisma.roomInventory.findMany({
      where: {
        roomTypeId: data.roomTypeId,
        date: {
          gte: start,
          lt: end,
        },
      },
    });

    // =========================
    // DAY BY DAY AVAILABILITY CHECK
    // =========================
    const currentDay = new Date(start);

    while (currentDay < end) {
      const dayStart = new Date(currentDay);

      const bookedForDay = reservations.reduce((sum, reservation) => {
        const reservationCoversDay =
          reservation.checkIn <= dayStart && reservation.checkOut > dayStart;

        if (!reservationCoversDay) {
          return sum;
        }

        return sum + reservation.roomCount;
      }, 0);

      const inventory = inventories.find(
        (inv) =>
          inv.date.toISOString().slice(0, 10) ===
          dayStart.toISOString().slice(0, 10),
      );

      const blockedForDay = inventory?.blockedCount ?? 0;

      const availableForDay =
        roomType.totalCount - bookedForDay - blockedForDay;

      if (availableForDay < data.roomCount) {
        throw new BadRequestException(
          `Only ${availableForDay} room(s) available on ${
            dayStart.toISOString().split('T')[0]
          }`,
        );
      }

      currentDay.setDate(currentDay.getDate() + 1);
    }

    // =========================
    // GUEST VALIDATION
    // =========================
    const countedGuests = data.adults + data.children;

    if (countedGuests > roomType.maxCapacity) {
      throw new BadRequestException(
        `Maximum allowed guests is ${roomType.maxCapacity}`,
      );
    }

    // =========================
    // EXTRA GUESTS
    // =========================
    const extraGuests = Math.max(countedGuests - roomType.normalCapacity, 0);

    const extraChildren = Math.min(data.children, extraGuests);

    const extraAdults = extraGuests - extraChildren;

    const childExtraPrice = extraChildren * 26.3;

    const adultExtraPrice = extraAdults * 41.3;

    const extraFee = childExtraPrice + adultExtraPrice;

    // =========================
    // PRICE
    // =========================
    const basePrice = Number(roomType.price);

    const nights = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    const subtotal = (basePrice + extraFee) * nights * data.roomCount;

    const discountPercent = roomType.discountPercent || 0;

    const discountAmount = (subtotal * discountPercent) / 100;

    const totalPrice = subtotal - discountAmount;

    // =========================
    // CREATE
    // =========================
    // return this.prisma.reservation.create({
    //   data: {
    //     userId: data.userId,
    //     roomTypeId: data.roomTypeId,

    //     checkIn: start,
    //     checkOut: end,

    //     roomCount: data.roomCount,

    //     adults: data.adults,
    //     children: data.children,
    //     babies: data.babies,

    //     basePrice,
    //     extraFee,
    //     discount: discountPercent,
    //     totalPrice,
    //   },
    // });

   const result = await this.prisma.$transaction(async (tx) => {
  // =========================
  // 1. CREATE RESERVATION
  // =========================
  const createdReservation = await tx.reservation.create({
    data: {
      userId: data.userId,
      roomTypeId: data.roomTypeId,
      checkIn: start,
      checkOut: end,
      roomCount: data.roomCount,
      adults: data.adults,
      children: data.children,
      babies: data.babies,
      basePrice,
      extraFee,
      discount: discountPercent,
      totalPrice,
    },
  });

  // =========================
  // 2. GET USER
  // =========================
  const user = await tx.user.findUnique({
    where: {
      id: data.userId,
    },
  });

  // =========================
  // 3. CREATE NOTIFICATION
  // =========================
  const notification = await tx.notification.create({
    data: {
      title: 'New Reservation',
      message: `${user?.name ?? 'User'} booked room from ${
        start.toISOString().split('T')[0]
      } to ${
        end.toISOString().split('T')[0]
      }`,
      type: NotificationType.RESERVATION,
    },
  });

  // =========================
  // 4. FIND ADMINS
  // =========================
  const admins = await tx.user.findMany({
    where: {
      role: 'ADMIN',
    },
    select: {
      id: true,
    },
  });

  // =========================
  // 5. CREATE READ RECORDS
  // =========================
  await tx.notificationRead.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      notificationId: notification.id,
      isRead: false,
    })),
  });

  return {
    createdReservation,
    notification,
    adminIds: admins.map((a) => a.id),
  };
});

// =========================
// 6. REALTIME AFTER COMMIT
// =========================

this.notificationsGateway.sendToUsers(
  result.adminIds,
  result.notification,
);

// =========================
// 7. RETURN RESERVATION
// =========================

return result.createdReservation;
  }
  // async updateReservation({
  //   id,
  //   userId,
  //   dto,
  // }: {
  //   id: string;
  //   userId: string;
  //   dto: UpdateReservationDto;
  // }) {
  //   // =========================
  //   // FIND RESERVATION
  //   // =========================
  //   const reservation = await this.prisma.reservation.findFirst({
  //     where: {
  //       id,
  //       userId,
  //     },
  //     include: {
  //       roomType: {
  //         include: {
  //           reservations: true,
  //         },
  //       },
  //     },
  //   });

  //   if (!reservation) {
  //     throw new NotFoundException("Reservation not found");
  //   }

  //   // =========================
  //   // CHECK IF ALREADY STARTED
  //   // =========================
  //   const now = new Date();
  //   const currentCheckIn = new Date(reservation.checkIn);

  //   if (now >= currentCheckIn) {
  //     throw new BadRequestException(
  //       "You cannot update reservation after check-in date"
  //     );
  //   }

  //   // =========================
  //   // MERGE DATA
  //   // =========================
  //   const checkIn = dto.checkIn
  //     ? new Date(dto.checkIn)
  //     : reservation.checkIn;

  //   const checkOut = dto.checkOut
  //     ? new Date(dto.checkOut)
  //     : reservation.checkOut;

  //   const adults = dto.adults ?? reservation.adults;
  //   const children = dto.children ?? reservation.children;
  //   const babies = dto.babies ?? reservation.babies;
  //   const roomCount = dto.roomCount ?? reservation.roomCount;

  //   // =========================
  //   // DATE VALIDATION
  //   // =========================
  //   if (checkIn >= checkOut) {
  //     throw new BadRequestException("Invalid date range");
  //   }

  //   // =========================
  //   // OVERLAP CHECK (EXCLUDE CURRENT RESERVATION)
  //   // =========================
  //   const overlapping = reservation.roomType.reservations.filter(
  //     (r) =>
  //       r.id !== id &&
  //       r.status !== "CANCELLED" &&
  //       r.checkIn < checkOut &&
  //       r.checkOut > checkIn
  //   );

  //   const bookedRooms = overlapping.reduce(
  //     (sum, r) => sum + r.roomCount,
  //     0
  //   );

  //   const available = reservation.roomType.totalCount - bookedRooms;

  //   if (available < roomCount) {
  //     throw new BadRequestException(
  //       `Only ${available} rooms available`
  //     );
  //   }

  //   // =========================
  //   // GUEST VALIDATION
  //   // =========================
  //   const totalGuests = adults + children;

  //   if (totalGuests > reservation.roomType.maxCapacity) {
  //     throw new BadRequestException("Max capacity exceeded");
  //   }

  //   // =========================
  //   // EXTRA FEE LOGIC
  //   // =========================
  //   const extraGuests = Math.max(
  //     totalGuests - reservation.roomType.normalCapacity,
  //     0
  //   );

  //   const extraChildren = Math.min(extraGuests, children);
  //   const extraAdults = extraGuests - extraChildren;

  //   const extraFee =
  //     extraChildren * 26.3 + extraAdults * 41.3;

  //   // =========================
  //   // PRICING
  //   // =========================
  //   const basePrice = Number(reservation.roomType.price);

  //   const nights = Math.ceil(
  //     (checkOut.getTime() - checkIn.getTime()) /
  //       (1000 * 60 * 60 * 24)
  //   );

  //   const subtotal =
  //     (basePrice + extraFee) * nights * roomCount;

  //   const discountPercent =
  //     reservation.roomType.discountPercent || 0;

  //   const discountAmount =
  //     (subtotal * discountPercent) / 100;

  //   const totalPrice = subtotal - discountAmount;

  //   // =========================
  //   // UPDATE
  //   // =========================
  //   return this.prisma.reservation.update({
  //     where: { id },
  //     data: {
  //       checkIn,
  //       checkOut,
  //       adults,
  //       children,
  //       babies,
  //       roomCount,

  //       basePrice,
  //       extraFee,
  //       discount: discountPercent,
  //       totalPrice,
  //     },
  //   });
  // }
  async updateReservation({
    id,
    userId,
    dto,
  }: {
    id: string;
    userId: string;
    dto: UpdateReservationDto;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // =========================
      // FIND RESERVATION (LOCKED READ STYLE)
      // =========================
      const reservation = await tx.reservation.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          roomType: {
            include: {
              reservations: true,
            },
          },
        },
      });

      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      const now = new Date();

      if (now >= reservation.checkIn) {
        throw new BadRequestException('You cannot update after check-in');
      }

      // =========================
      // MERGE INPUT
      // =========================
      const checkIn = dto.checkIn ? new Date(dto.checkIn) : reservation.checkIn;

      const checkOut = dto.checkOut
        ? new Date(dto.checkOut)
        : reservation.checkOut;

      const roomCount = dto.roomCount ?? reservation.roomCount;

      const adults = dto.adults ?? reservation.adults;

      const children = dto.children ?? reservation.children;

      const babies = dto.babies ?? reservation.babies;

      if (checkIn >= checkOut) {
        throw new BadRequestException('Invalid dates');
      }

      // =========================
      // INVENTORY FETCH (LOCKING RANGE)
      // =========================
      const inventories = await tx.roomInventory.findMany({
        where: {
          roomTypeId: reservation.roomTypeId,
          date: {
            gte: checkIn,
            lt: checkOut,
          },
        },
      });

      // =========================
      // OVERLAPS (EXCLUDE CURRENT)
      // =========================
      const overlapping = reservation.roomType.reservations.filter(
        (r) =>
          r.id !== id &&
          r.status !== 'CANCELLED' &&
          r.checkIn < checkOut &&
          r.checkOut > checkIn,
      );

      // =========================
      // BUILD DAYS
      // =========================
      const days: Date[] = [];

      const current = new Date(checkIn);

      while (current < checkOut) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      // =========================
      // SAFE AVAILABILITY CHECK
      // =========================
      for (const day of days) {
        const booked = overlapping.reduce((sum, r) => {
          if (day >= r.checkIn && day < r.checkOut) {
            return sum + r.roomCount;
          }
          return sum;
        }, 0);

        const blocked = inventories
          .filter(
            (i) =>
              i.date.toISOString().slice(0, 10) ===
              day.toISOString().slice(0, 10),
          )
          .reduce((sum, i) => sum + i.blockedCount, 0);

        const available = reservation.roomType.totalCount - booked - blocked;

        if (available < roomCount) {
          throw new BadRequestException(
            `Only ${available} rooms available on ${day
              .toISOString()
              .slice(0, 10)}`,
          );
        }
      }

      // =========================
      // GUEST VALIDATION
      // =========================
      const totalGuests = adults + children;

      if (totalGuests > reservation.roomType.maxCapacity) {
        throw new BadRequestException('Max capacity exceeded');
      }

      // =========================
      // EXTRA LOGIC
      // =========================
      const extraGuests = Math.max(
        totalGuests - reservation.roomType.normalCapacity,
        0,
      );

      const extraChildren = Math.min(children, extraGuests);

      const extraAdults = extraGuests - extraChildren;

      const extraFee = extraChildren * 26.3 + extraAdults * 41.3;

      // =========================
      // PRICE
      // =========================
      const basePrice = Number(reservation.roomType.price);

      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      );

      const subtotal = (basePrice + extraFee) * nights * roomCount;

      const discountPercent = reservation.roomType.discountPercent || 0;

      const totalPrice = subtotal - (subtotal * discountPercent) / 100;

      // =========================
      // UPDATE (ATOMIC)
      // =========================
      return tx.reservation.update({
        where: { id },
        data: {
          checkIn,
          checkOut,
          roomCount,
          adults,
          children,
          babies,
          basePrice,
          extraFee,
          discount: discountPercent,
          totalPrice,
        },
      });
    });
  }
  async cancelReservation({ id, userId }: { id: string; userId: string }) {
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id,
        userId, // user yalnız öz rezervasiyasını cancel edə bilər
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // artıq cancel olunubsa
    if (reservation.status === 'CANCELLED') {
      throw new BadRequestException('Already cancelled');
    }

    // check-in keçibsə cancel etmə
    const now = new Date();
    const checkIn = new Date(reservation.checkIn);

    if (now >= checkIn) {
      throw new BadRequestException('You cannot cancel after check-in date');
    }

    return this.prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }
}
