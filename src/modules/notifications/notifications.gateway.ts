import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query
      .userId as string;

    console.log(
      `Socket connected: ${client.id} | user: ${userId}`,
    );

    if (userId) {
      client.join(`user:${userId}`);

      console.log(
        `User ${userId} joined room user:${userId}`,
      );
    }
  }

  handleDisconnect(client: Socket) {
    console.log(
      `Socket disconnected: ${client.id}`,
    );
  }

  // =========================
  // SINGLE USER
  // =========================

  sendToUser(
    userId: string,
    notification: any,
  ) {
    this.server
      .to(`user:${userId}`)
      .emit('notification', notification);
  }

  // =========================
  // MULTIPLE USERS
  // =========================

  sendToUsers(
    userIds: string[],
    notification: any,
  ) {
    userIds.forEach((userId) => {
      this.server
        .to(`user:${userId}`)
        .emit('notification', notification);
    });
  }

  // =========================
  // ALL USERS (OPTIONAL)
  // =========================

  sendToAll(notification: any) {
    this.server.emit(
      'notification',
      notification,
    );
  }
}