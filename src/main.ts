import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { StructuredLogger } from './common/logger/structured-logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: new StructuredLogger(),
  });

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  await app.listen(process.env.PORT ?? 3005);
}
void bootstrap();
