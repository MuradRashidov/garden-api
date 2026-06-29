import { HttpStatus } from "@nestjs/common";
import { AppException } from "../app.exception";
import { ErrorType } from "../../enums/error-type.enum";

export class InvalidTokenException extends AppException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      ErrorType.AUTHENTICATION,
      "Invalid or expired access token.",
    );
  }
}