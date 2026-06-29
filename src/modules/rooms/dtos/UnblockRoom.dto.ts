import { IsDateString, IsInt, IsString } from "class-validator";

export class UnblockRoomDto {
  @IsString()
  roomTypeId: string;

  @IsDateString()
  date: string;

  @IsInt()
  blockedCount: number;
}