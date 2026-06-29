import { HttpStatus } from "@nestjs/common";
import { AppException } from "../app.exception";
import { ErrorType } from "../../enums/error-type.enum";

export class RoomNotAvailableException extends AppException {
  constructor(available: number) {
    super(
      HttpStatus.BAD_REQUEST,
      ErrorType.RESERVATION,
      `Only ${available} room(s) available.`,
    );
  }
}