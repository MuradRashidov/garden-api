import { HttpStatus } from "@nestjs/common";
import { ErrorType } from "src/common/enums/error-type.enum";
import { AppException } from "../app.exception";

export class EmailAlreadyExistsException extends AppException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      ErrorType.CONFLICT,
      "Email already exists.",
    );
  }
}
export class InvalidCredentialsException extends AppException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      ErrorType.AUTHENTICATION,
      "Invalid email or password.",
    );
  }
}
export class InvalidTokenException extends AppException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      ErrorType.AUTHENTICATION,
      "Invalid or expired access token.",
    );
  }
}
export class UserNotFoundException extends AppException {
  constructor() {
    super(
      HttpStatus.NOT_FOUND,
      ErrorType.NOT_FOUND,
      "User not found.",
    );
  }
}
export class GoogleAuthenticationException extends AppException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      ErrorType.AUTHENTICATION,
      "Google authentication failed.",
    );
  }
}
export class RefreshTokenExpiredException extends AppException {
  constructor() {
    super(
      HttpStatus.UNAUTHORIZED,
      ErrorType.AUTHENTICATION,
      "Refresh token has expired.",
    );
  }
}
export class AccountDisabledException extends AppException {
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      ErrorType.AUTHORIZATION,
      "Your account has been disabled.",
    );
  }
}