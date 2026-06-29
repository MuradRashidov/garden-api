import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app.exception";
import { ErrorType } from "../enums/error-type.enum";

export class ValidationException extends AppException {
  constructor(errors: ValidationErrorItem[]) {
    super(
      HttpStatus.BAD_REQUEST,
      ErrorType.VALIDATION,
      "Validation failed.",
      errors,
    );
  }
}

export interface ValidationErrorItem {
  field: string;
  message: string;
}