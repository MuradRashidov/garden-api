import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";

export class BlockRoomDto {
  @IsString()
  roomTypeId: string;

  @IsDateString()
  date: string;

  @IsInt()
  blockedCount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}