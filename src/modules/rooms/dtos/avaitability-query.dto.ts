import { IsDateString } from 'class-validator';

export class AvailabilityQueryDto {
  @IsDateString()
  start: string;

  @IsDateString()
  end: string;
}