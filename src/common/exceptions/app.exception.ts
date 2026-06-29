import { HttpException, HttpStatus } from "@nestjs/common";

export class AppException extends HttpException {
  constructor(
    statusCode: HttpStatus,
    type: string,
    message: string,
    details: any = null,
  ) {
    super(
      {
        success: false,
        type,
        message,
        details,
      },
      statusCode,
    );
  }
}