import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma/prisma.service";
import { CreateRoomTypeDto } from "./dtos/CreateRoomType.dto";
import { CloudinaryService } from "../cloudianry/cloudianry.service";
import { UpdateRoomTypeDto } from "./dtos/UpdateRoomType.dto";

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService,private cloudinary: CloudinaryService) {}

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
    if ((!checkIn || !checkOut) && userRole === 'CUSTOMER') {
      console.log('Customer requested rooms without date filters, returning empty list');
  return [];
}
if((!checkIn || !checkOut) && userRole==="ADMIN"){
  return rooms;
}
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
            reservation.status !== "CANCELLED" &&
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
        const availableCount =
          room.totalCount - bookedCount - blockedCount;

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
async createRoom(
  dto: CreateRoomTypeDto,
  files: Express.Multer.File[],
) {
  if (!files?.length) {
    throw new BadRequestException(
      'At least one image is required',
    );
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

        discountPercent:
          Number(dto.discountPercent) || 0,
      },
    });

    // =========================
    // UPLOAD IMAGES
    // =========================
    const uploadedImages =
      await Promise.all(
        files.map((file) =>
          this.cloudinary.uploadImage(
            file,
            `room-types/${roomType.id}`,
          ),
        ),
      );

    // =========================
    // SAVE IMAGE RECORDS
    // =========================
    await tx.roomImage.createMany({
      data: uploadedImages.map(
        (image: any) => ({
          roomTypeId: roomType.id,

          imageUrl: image.secure_url,

          publicId:
            image.public_id ?? null,
        }),
      ),
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

    const roomType =
      await tx.roomType.findUnique({
        where: {
          id: roomTypeId,
        },
        include: {
          images: true,
        },
      });

    if (!roomType) {
      throw new NotFoundException(
        'Room type not found',
      );
    }

    // =========================
    // DELETE IMAGES
    // =========================

    if (dto.deletedImageIds) {
      const imageIds: string[] =
        JSON.parse(dto.deletedImageIds);

      const imagesToDelete =
        roomType.images.filter((img) =>
          imageIds.includes(img.id),
        );

      for (const image of imagesToDelete) {
        await this.cloudinary.deleteImage(
          image.publicId,
        );
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
        const uploadResult =
          await this.cloudinary.uploadImage(
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

    const updatedRoomType =
      await tx.roomType.update({
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
            normalCapacity:
              dto.normalCapacity,
          }),

          ...(dto.maxCapacity !== undefined && {
            maxCapacity:
              dto.maxCapacity,
          }),

          ...(dto.discountPercent !==
            undefined && {
            discountPercent:
              dto.discountPercent,
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
}