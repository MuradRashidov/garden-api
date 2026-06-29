import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma/prisma.service';
import { CreateRoomTypeDto } from './dtos/CreateRoomType.dto';
import { CloudinaryService } from '../cloudianry/cloudianry.service';
import { UpdateRoomTypeDto } from './dtos/UpdateRoomType.dto';
import { BlockRoomDto } from './dtos/BlockRoom.dto';
import { UnblockRoomDto } from './dtos/UnblockRoom.dto';
import { Prisma, ReservationStatus } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async getRooms(checkIn?: string, checkOut?: string, userRole?: string) {
    const rooms = await this.prisma.roomType.findMany({
      include: {
        images: true,
        reservations: true,
      },
    });

    // if (!checkIn || !checkOut) {
    //   return rooms;
    // }

    // const start = new Date(checkIn);
    // const end = new Date(checkOut);
    console.log(`User role is ${userRole}`);
    if (!checkIn || !checkOut) {
      console.log(checkIn, checkOut);
      if (userRole === 'ADMIN') {
        return rooms;
      }
      if (userRole === 'CUSTOMER') {
        console.log(
          'Customer requested rooms without date filters, returning empty list',
        );
        return [];
      }
      //     console.log('Customer requested rooms without date filters, returning empty list');
      // return [];
    }
    // if((!checkIn || !checkOut) && userRole==="ADMIN"){
    //   return rooms;
    // }
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return rooms;
    }

    // inventory-ləri ayrıca çəkirik (PERFORMANCE üçün doğru yanaşma)
    const inventories = await this.prisma.roomInventory.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    return rooms
      .map((room) => {
        // =========================
        // 1. RESERVATIONS (APP + external bookings)
        // =========================
        const overlappingReservations = room.reservations.filter(
          (reservation) =>
            reservation.status !== 'CANCELLED' &&
            reservation.checkIn < end &&
            reservation.checkOut > start,
        );

        const bookedCount = overlappingReservations.reduce(
          (sum, r) => sum + (r.roomCount || 1),
          0,
        );

        // =========================
        // 2. INVENTORY (ADMIN BLOCK)
        // =========================
        const roomInventories = inventories.filter(
          (inv) => inv.roomTypeId === room.id,
        );

        const blockedCount = roomInventories.reduce(
          (sum, inv) => sum + inv.blockedCount,
          0,
        );

        // =========================
        // 3. FINAL AVAILABLE
        // =========================
        const availableCount = room.totalCount - bookedCount - blockedCount;

        return {
          ...room,
          availableCount,
        };
      })
      .filter((room) => room.availableCount > 0);
  }
  //   async createRoom(
  //   dto: CreateRoomTypeDto,
  //   files: Express.Multer.File[],
  // ) {
  //   console.log(dto);
  //   console.log(files);

  //   return {
  //     message: 'working',
  //   };
  // }
  async createRoom(dto: CreateRoomTypeDto, files: Express.Multer.File[]) {
    if (!files?.length) {
      throw new BadRequestException('At least one image is required');
    }

    return this.prisma.$transaction(async (tx) => {
      // =========================
      // CREATE ROOM TYPE
      // =========================
      const roomType = await tx.roomType.create({
        data: {
          name: dto.name,
          description: dto.description,
          size: Number(dto.size),
          price: Number(dto.price),

          totalCount: Number(dto.totalCount),

          normalCapacity: Number(dto.normalCapacity),
          maxCapacity: Number(dto.maxCapacity),

          discountPercent: Number(dto.discountPercent) || 0,
        },
      });

      // =========================
      // UPLOAD IMAGES
      // =========================
      const uploadedImages = await Promise.all(
        files.map((file) =>
          this.cloudinary.uploadImage(file, `room-types/${roomType.id}`),
        ),
      );

      // =========================
      // SAVE IMAGE RECORDS
      // =========================
      await tx.roomImage.createMany({
        data: uploadedImages.map((image: any) => ({
          roomTypeId: roomType.id,

          imageUrl: image.secure_url,

          publicId: image.public_id ?? null,
        })),
      });

      // =========================
      // RETURN CREATED ROOM
      // =========================
      return tx.roomType.findUnique({
        where: {
          id: roomType.id,
        },
        include: {
          images: true,
        },
      });
    });
  }
  async updateRoomType(
    roomTypeId: string,
    dto: UpdateRoomTypeDto,
    files: Express.Multer.File[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const roomType = await tx.roomType.findUnique({
        where: {
          id: roomTypeId,
        },
        include: {
          images: true,
        },
      });

      if (!roomType) {
        throw new NotFoundException('Room type not found');
      }

      // =========================
      // DELETE IMAGES
      // =========================

      if (dto.deletedImageIds) {
        const imageIds: string[] = JSON.parse(dto.deletedImageIds);

        const imagesToDelete = roomType.images.filter((img) =>
          imageIds.includes(img.id),
        );

        for (const image of imagesToDelete) {
          await this.cloudinary.deleteImage(image.publicId);
        }

        await tx.roomImage.deleteMany({
          where: {
            id: {
              in: imageIds,
            },
          },
        });
      }

      // =========================
      // UPLOAD NEW IMAGES
      // =========================

      if (files?.length) {
        for (const file of files) {
          const uploadResult = await this.cloudinary.uploadImage(
            file,
            `room-types/${roomType.id}`,
          );

          await tx.roomImage.create({
            data: {
              roomTypeId: roomType.id,
              imageUrl: uploadResult.secure_url,
              publicId: uploadResult.public_id,
            },
          });
        }
      }

      // =========================
      // UPDATE ROOM TYPE
      // =========================

      const updatedRoomType = await tx.roomType.update({
        where: {
          id: roomTypeId,
        },
        data: {
          ...(dto.name !== undefined && {
            name: dto.name,
          }),

          ...(dto.description !== undefined && {
            description: dto.description,
          }),

          ...(dto.size !== undefined && {
            size: dto.size,
          }),

          ...(dto.price !== undefined && {
            price: dto.price,
          }),

          ...(dto.totalCount !== undefined && {
            totalCount: dto.totalCount,
          }),

          ...(dto.normalCapacity !== undefined && {
            normalCapacity: dto.normalCapacity,
          }),

          ...(dto.maxCapacity !== undefined && {
            maxCapacity: dto.maxCapacity,
          }),

          ...(dto.discountPercent !== undefined && {
            discountPercent: dto.discountPercent,
          }),
        },
        include: {
          images: true,
        },
      });

      return updatedRoomType;
    });
  }
  async deleteRoomType(roomTypeId: string) {
    const roomType = await this.prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: { images: true },
    });

    if (!roomType) {
      throw new NotFoundException('Room type not found');
    }

    // =========================
    // 1. CLOUDINARY CLEANUP (OPTIONAL AMA BEST PRACTICE)
    // =========================
    for (const image of roomType.images) {
      if (image.publicId) {
        await this.cloudinary.deleteImage(image.publicId);
      }
    }

    // =========================
    // 2. INVENTORY CLEANUP (OPTIONAL)
    // =========================
    await this.prisma.roomInventory.deleteMany({
      where: { roomTypeId },
    });

    // =========================
    // 3. SOFT DELETE ROOM TYPE
    // =========================
    const deleted = await this.prisma.roomType.update({
      where: { id: roomTypeId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Room type soft deleted successfully',
      data: deleted,
    };
  }
  async getAvailability(start?: string, days: number = 30) {
    const startDate = start ? new Date(start) : new Date();

    if (isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid start date');
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    // =========================
    // ROOM TYPES
    // =========================
    const roomTypes = await this.prisma.roomType.findMany({
      select: {
        id: true,
        name: true,
        totalCount: true,
      },
    });

    // =========================
    // ACTIVE RESERVATIONS
    // =========================
    const reservations = await this.prisma.reservation.findMany({
      where: {
        roomTypeId: {
          in: roomTypes.map((r) => r.id),
        },
        status: {
          not: 'CANCELLED',
        },
        checkIn: { lt: endDate },
        checkOut: { gt: startDate },
      },
      select: {
        roomTypeId: true,
        checkIn: true,
        checkOut: true,
        roomCount: true,
      },
    });

    // =========================
    // INVENTORY BLOCKS
    // =========================
    const inventories = await this.prisma.roomInventory.findMany({
      where: {
        roomTypeId: {
          in: roomTypes.map((r) => r.id),
        },
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        roomTypeId: true,
        date: true,
        blockedCount: true,
      },
    });

    // =========================
    // MAP INVENTORY (FAST)
    // =========================
    const inventoryMap = new Map<string, number>();

    for (const inv of inventories) {
      const key = `${inv.roomTypeId}_${inv.date.toISOString().split('T')[0]}`;

      inventoryMap.set(key, inv.blockedCount);
    }

    // =========================
    // RESULT BUILD
    // =========================
    const result: any[] = [];

    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
      const dayKey = d.toISOString().split('T')[0];

      const dayRow: any = {
        date: dayKey,
        rooms: [],
      };

      for (const roomType of roomTypes) {
        const booked = reservations.reduce((sum, r) => {
          const overlaps =
            r.roomTypeId === roomType.id && r.checkIn <= d && r.checkOut > d;

          return overlaps ? sum + r.roomCount : sum;
        }, 0);

        const blocked = inventoryMap.get(`${roomType.id}_${dayKey}`) || 0;

        const available = roomType.totalCount - booked - blocked;

        dayRow.rooms.push({
          roomTypeId: roomType.id,
          name: roomType.name,
          total: roomType.totalCount,
          booked,
          blocked,
          available,
        });
      }

      result.push(dayRow);
    }

    return result;
  }
  async blockRoom(data: BlockRoomDto, adminId: string) {
    const date = new Date(data.date);

    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    return this.prisma.$transaction(async (tx) => {
      const roomType = await tx.roomType.findUnique({
        where: { id: data.roomTypeId },
      });

      if (!roomType) {
        throw new NotFoundException('Room type not found');
      }

      // ACTIVE RESERVATIONS
      const reservations = await tx.reservation.findMany({
        where: {
          roomTypeId: data.roomTypeId,
          status: { not: 'CANCELLED' },
          checkIn: { lte: date },
          checkOut: { gt: date },
        },
        select: { roomCount: true },
      });

      const booked = reservations.reduce((sum, r) => sum + r.roomCount, 0);

      // CURRENT BLOCK
      const inventory = await tx.roomInventory.findUnique({
        where: {
          roomTypeId_date: {
            roomTypeId: data.roomTypeId,
            date,
          },
        },
      });

      const currentBlocked = inventory?.blockedCount ?? 0;

      const available = roomType.totalCount - booked - currentBlocked;

      if (data.blockedCount > available) {
        throw new BadRequestException(`Only ${available} room(s) available`);
      }

      const newBlocked = currentBlocked + data.blockedCount;

      // IMPORTANT: availableCount DB-də YAZILMIR
      return tx.roomInventory.upsert({
        where: {
          roomTypeId_date: {
            roomTypeId: data.roomTypeId,
            date,
          },
        },
        update: {
          blockedCount: newBlocked,
          reason: data.reason,
          createdById: adminId,
        },
        create: {
          roomTypeId: data.roomTypeId,
          date,
          blockedCount: data.blockedCount,
          reason: data.reason,
          createdById: adminId,
          availableCount: roomType.totalCount, // FIX ONLY TO SATISFY PRISMA
        },
      });
    });
  }
  async unblockRoom(data: UnblockRoomDto) {
    const date = new Date(data.date);

    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.roomInventory.findUnique({
        where: {
          roomTypeId_date: {
            roomTypeId: data.roomTypeId,
            date,
          },
        },
      });

      if (!inventory) {
        throw new NotFoundException('No blocked rooms found for this date');
      }

      // =========================
      // VALIDATION
      // =========================
      if (data.blockedCount > inventory.blockedCount) {
        throw new BadRequestException(
          `Only ${inventory.blockedCount} room(s) are currently blocked`,
        );
      }

      const newBlocked = inventory.blockedCount - data.blockedCount;

      // =========================
      // DELETE IF ZERO
      // =========================
      if (newBlocked === 0) {
        return tx.roomInventory.delete({
          where: {
            id: inventory.id,
          },
        });
      }

      // =========================
      // UPDATE
      // =========================
      return tx.roomInventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          blockedCount: newBlocked,
        },
      });
    });
  }
  async recommendedRooms() {
    return this.prisma.roomType.findMany({
      include: {
        images: true,
        _count: {
          select: {
            reservations: true,
          },
        },
      },
      orderBy: {
        reservations: {
          _count: 'desc',
        },
      },
      take: 5,
    });
  }
  async searchAvailability(
  start: string,
  end: string,
) {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (
    isNaN(startDate.getTime()) ||
    isNaN(endDate.getTime())
  ) {
    throw new BadRequestException("Invalid dates");
  }

  if (startDate > endDate) {
    throw new BadRequestException(
      "Start date must be before end date",
    );
  }

  const roomTypes = await this.prisma.roomType.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  const reservations = await this.prisma.reservation.findMany({
    where: {
      status: {
        not: ReservationStatus.CANCELLED,
      },
      checkIn: {
        lt: endDate,
      },
      checkOut: {
        gt: startDate,
      },
    },
    select: {
      roomTypeId: true,
      roomCount: true,
      checkIn: true,
      checkOut: true,
    },
  });

  const inventories = await this.prisma.roomInventory.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      roomTypeId: true,
      date: true,
      blockedCount: true,
    },
  });

  const result = [];

  const current = new Date(startDate);

  while (current <= endDate) {
    const day = new Date(current);

    const rooms = roomTypes.map((roomType) => {
      const booked = reservations.reduce((sum, reservation) => {
        const reserved =
          reservation.roomTypeId === roomType.id &&
          reservation.checkIn <= day &&
          reservation.checkOut > day;

        return reserved
          ? sum + reservation.roomCount
          : sum;
      }, 0);

      const inventory = inventories.find(
        (inv) =>
          inv.roomTypeId === roomType.id &&
          inv.date.toISOString().slice(0, 10) ===
            day.toISOString().slice(0, 10),
      );

      const blocked = inventory?.blockedCount ?? 0;

      return {
        roomTypeId: roomType.id,
        name: roomType.name,
        total: roomType.totalCount,
        booked,
        blocked,
        available:
          roomType.totalCount - booked - blocked,
      };
    });

    result.push({
      date: day.toISOString().slice(0, 10),
      rooms,
    });

    current.setDate(current.getDate() + 1);
  }

  return result;
}
}
