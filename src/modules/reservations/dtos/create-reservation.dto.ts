import {
  IsDateString,
  IsInt,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Min,
} from "class-validator";

export class CreateReservationDto {
  @IsUUID()
  roomTypeId: string;

  @IsDateString()
  checkIn: string;

  @IsDateString()
  checkOut: string;

  @IsInt()
  @Min(1)
  roomCount: number;

  @IsInt()
  @Min(1)
  adults: number;

  @IsInt()
  @Min(0)
  children: number;

  @IsInt()
  @Min(0)
  babies: number;

  @IsString()
  countryCode: string;

  @IsString()
  phoneNumber: string;
}