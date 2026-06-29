import { HttpStatus } from "@nestjs/common";
import { ErrorType } from "src/common/enums/error-type.enum";
import { AppException } from "../app.exception";

export class RoomTypeNotFoundException extends AppException {
  constructor() {
    super(
      HttpStatus.NOT_FOUND,
      ErrorType.NOT_FOUND,
      "Room type not found.",
    );
  }
}