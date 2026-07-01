import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import 'dotenv/config';

import { AppModule } from './app.module';
import { AllExceptionFilter } from './common/filters/all-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ValidationException } from './common/exceptions/validation.exception';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,

      exceptionFactory: (validationErrors) => {
        const errors = validationErrors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints ?? {})[0],
        }));

        return new ValidationException(errors);
      },
    }),
  );

  // Success Response
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Exception Handler
  app.useGlobalFilters(new AllExceptionFilter());

  // CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

 const port = process.env.PORT || 3000;

await app.listen(port);

console.log(`🚀 Server is running on port ${port}`);

  console.log(`🚀 Server is running on http://localhost:${port}`);
  process.on('unhandledRejection', (reason) => {
    console.error(reason);
  });

  process.on('uncaughtException', (error) => {
    console.error(error);
  });

  // bootstrap().catch((error) => {
  //   console.error(error);
  //   process.exit(1);
  // });
}

bootstrap();
