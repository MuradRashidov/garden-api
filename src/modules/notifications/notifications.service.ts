import { Injectable } from '@nestjs/common';
import {
  NotificationType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  // =====================================
  // CREATE + REALTIME EMIT
  // =====================================

  async createAndEmit(data: {
    title: string;
    message: string;
    type?: NotificationType;
    userIds: string[];
  }) {
    const notification =
      await this.prisma.notification.create({
        data: {
          title: data.title,
          message: data.message,
          type:
            data.type ??
            NotificationType.SYSTEM,
        },
      });

    await this.prisma.notificationRead.createMany({
      data: data.userIds.map((userId) => ({
        userId,
        notificationId: notification.id,
        isRead: false,
      })),
    });

    // realtime
    this.gateway.sendToUsers(
      data.userIds,
      notification,
    );

    return notification;
  }

  // =====================================
  // GET NOTIFICATIONS
  // =====================================

  async findAll(
    userId: string,
    role: UserRole,
  ) {
    const reads =
      await this.prisma.notificationRead.findMany({
        where: {
          userId,

          ...(role === UserRole.ADMIN
            ? {
                notification: {
                  type: NotificationType.RESERVATION,
                },
              }
            : {
                notification: {
                  type: {
                    not: NotificationType.RESERVATION,
                  },
                },
              }),
        },

        include: {
          notification: true,
        },

        orderBy: {
          notification: {
            createdAt: 'desc',
          },
        },
      });

    return reads.map((r) => ({
      id: r.notification.id,
      title: r.notification.title,
      message: r.notification.message,
      type: r.notification.type,
      createdAt:
        r.notification.createdAt,
      isRead: r.isRead,
      readAt: r.readAt,
    }));
  }

  // =====================================
  // UNREAD COUNT
  // =====================================

  async findUnread(
    userId: string,
    role: UserRole,
  ) {
    return this.prisma.notificationRead.count({
      where: {
        userId,
        isRead: false,

        ...(role === UserRole.ADMIN
          ? {
              notification: {
                type:
                  NotificationType.RESERVATION,
              },
            }
          : {
              notification: {
                type: {
                  not:
                    NotificationType.RESERVATION,
                },
              },
            }),
      },
    });
  }

  // =====================================
  // MARK ONE READ
  // =====================================

  async markAsRead(
    userId: string,
    notificationId: string,
  ) {
    return this.prisma.notificationRead.updateMany({
      where: {
        userId,
        notificationId,
      },

      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  // =====================================
  // MARK ALL READ
  // =====================================

  async markAllAsRead(userId: string) {
    return this.prisma.notificationRead.updateMany({
      where: {
        userId,
        isRead: false,
      },

      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  // =====================================
  // DELETE
  // =====================================

  async delete(notificationId: string) {
    return this.prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });
  }

  // =====================================
  // CLEANUP
  // =====================================

  async cleanupExpiredNotifications() {
    return this.prisma.notification.deleteMany({
      where: {
        OR: [
          {
            type: NotificationType.EVENT,
            createdAt: {
              lt: new Date(
                Date.now() -
                  7 *
                    24 *
                    60 *
                    60 *
                    1000,
              ),
            },
          },

          {
            type:
              NotificationType.RESERVATION,
            createdAt: {
              lt: new Date(
                Date.now() -
                  30 *
                    24 *
                    60 *
                    60 *
                    1000,
              ),
            },
          },
        ],
      },
    });
  }
}