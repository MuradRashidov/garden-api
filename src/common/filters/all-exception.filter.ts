import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);
  private getErrorType(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';

      case HttpStatus.UNAUTHORIZED:
        return 'AUTHENTICATION';

      case HttpStatus.FORBIDDEN:
        return 'AUTHORIZATION';

      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';

      case HttpStatus.CONFLICT:
        return 'CONFLICT';

      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION';

      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT';

      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'SERVICE_UNAVAILABLE';

      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';

      default:
        if (statusCode >= 500) {
          return 'INTERNAL_SERVER_ERROR';
        }

        return 'HTTP_EXCEPTION';
    }
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();

    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    let body: any = {
      success: false,
      type: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    };

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        body = {
          success: false,
          type: 'HTTP_EXCEPTION',
          message: exceptionResponse,
        };
      } else {
        body = exceptionResponse;
      }
    }

    // this.logger.error({
    //   method: request.method,
    //   path: request.originalUrl,
    //   ip: request.ip,
    //   body: request.body,
    //   params: request.params,
    //   query: request.query,
    //   exception,
    // });
    this.logger.error(
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );
    response.status(statusCode).json({
      success: body.success ?? false,
      statusCode,
      type: body.type ?? this.getErrorType(statusCode),

      message: body.message ?? 'Internal server error',

      details: body.details ?? body.errors ?? null,

      timestamp: new Date().toISOString(),

      request: {
        method: request.method,
        path: request.originalUrl,
      },
    });
  }
}
