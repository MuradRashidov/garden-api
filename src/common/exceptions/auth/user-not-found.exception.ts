
import { HttpStatus } from "@nestjs/common";
import { AppException } from "../app.exception";
import { ErrorType } from "../../enums/error-type.enum";

export class UserNotFoundException extends AppException {
  constructor() {
    super(
      HttpStatus.NOT_FOUND,
      ErrorType.NOT_FOUND,
      "User not found.",
    );
  }
}