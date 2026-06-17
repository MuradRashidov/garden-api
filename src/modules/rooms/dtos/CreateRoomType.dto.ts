// import {
//   IsInt,
//   IsNumber,
//   IsOptional,
//   IsString,
// } from 'class-validator';

// export class CreateRoomTypeDto {
//   @IsString()
//   name: string;

//   @IsOptional()
//   @IsString()
//   description?: string;

//   @IsInt()
//   size: number;

//   @IsNumber()
//   price: number;

//   @IsInt()
//   totalCount: number;

//   @IsInt()
//   normalCapacity: number;

//   @IsInt()
//   maxCapacity: number;

//   @IsOptional()
//   @IsInt()
//   discountPercent?: number;
// }
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRoomTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsInt()
  size: number;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @Type(() => Number)
  @IsInt()
  totalCount: number;

  @Type(() => Number)
  @IsInt()
  normalCapacity: number;

  @Type(() => Number)
  @IsInt()
  maxCapacity: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  discountPercent?: number;
}