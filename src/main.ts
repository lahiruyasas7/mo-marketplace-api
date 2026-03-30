import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './config/swagger-config/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const isProd = process.env.NODE_ENV === 'production';

  // Global validation pipe — enforces all DTOs automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties
      forbidNonWhitelisted: true, // throw if unknown props sent
      transform: true, // auto-transform payloads to DTO types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  //Cookie parsing (required for HTTP-only cookie auth)
  app.use(cookieParser());

  // ── Swagger (only in non-production environments)
  if (!isProd) {
    setupSwagger(app);
  }

  // API prefix
  app.setGlobalPrefix('api/v1');

  await app.listen(configService.get('app.port'), () => {
    console.log(`Server running at port: ${configService.get('app.port')}`);
  });
}
bootstrap();
