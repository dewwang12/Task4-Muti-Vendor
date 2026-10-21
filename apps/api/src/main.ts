import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // 1. Enable CORS for frontend clients
  app.enableCors({
    origin: [
      configService.get<string>('frontendUrl') || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // 2. Global versioned prefix
  app.setGlobalPrefix('api/v1');

  // 3. Serve uploaded files statically
  const uploadDir = path.resolve(
    configService.get<string>('storage.localDir') || './uploads',
  );
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

  // 4. Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // 5. Global filters & interceptors
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());

  // 6. Swagger / OpenAPI 3.0 Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MarketHub Multi-Vendor API')
    .setDescription(
      'REST API Documentation for MarketHub — Multi-Vendor E-Commerce Marketplace supporting Customers, Vendors, Delivery Partners, and Admins.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'MarketHub API Explorer',
  });

  const port = configService.get<number>('port') || 4000;
  await app.listen(port);

  logger.log(`🚀 MarketHub Backend running at: http://localhost:${port}/api/v1`);
  logger.log(`📖 Swagger API Docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
