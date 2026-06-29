import { HttpStatus } from "@nestjs/common";
import { ErrorType } from "src/common/enums/error-type.enum";
import { AppException } from "../app.exception";

export class InvalidReservationDateException extends AppException {
  constructor() {
    super(
      HttpStatus.BAD_REQUEST,
      ErrorType.RESERVATION,
      "Check-out must be after check-in.",
    );
  }
}