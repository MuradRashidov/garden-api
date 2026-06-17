import { PartialType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateRoomTypeDto } from './CreateRoomType.dto';

export class UpdateRoomTypeDto extends PartialType(
  CreateRoomTypeDto,
) {
  @IsOptional()
  @IsString()
  deletedImageIds?: string;
}