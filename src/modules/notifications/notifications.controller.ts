import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/users.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RequestWithUser } from 'src/common/interfaces/request-with-user.interface';
import { UserRole } from '@prisma/client';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // =========================
  // GET ALL (USER BASED)
  // =========================
  @Get()
  @Roles('ADMIN', 'CUSTOMER')
  async findAll(@Req() req: RequestWithUser) {
    return await this.notificationsService.findAll(
      req.user.id,
      req.user.role as UserRole,
    );
  }

  // =========================
  // UNREAD COUNT
  // =========================
  @Get('unread')
  @Roles('ADMIN', 'CUSTOMER')
  async getUnread(@Req() req: RequestWithUser) {
    return await this.notificationsService.findUnread(
      req.user.id,
      req.user.role as UserRole,
    );
  }

  // =========================
  // MARK ONE AS READ
  // =========================
  @Patch(':id/read')
  @Roles('ADMIN', 'CUSTOMER')
  markAsRead(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.notificationsService.markAsRead(req.user.id, id);
  }

  // =========================
  // MARK ALL AS READ
  // =========================
  @Patch('read-all')
  @Roles('ADMIN', 'CUSTOMER')
  markAll(@Req() req: RequestWithUser) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  // =========================
  // DELETE
  // =========================
  @Delete(':id')
  @Roles('ADMIN', 'CUSTOMER')
  delete(@Param('id') id: string) {
    return this.notificationsService.delete(id);
  }
}
