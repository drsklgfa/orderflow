import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const origins = config
    .getOrThrow<string>('CORS_ORIGINS')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser(config.getOrThrow<string>('COOKIE_SECRET')));
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Idempotency-Key'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();

  if (config.get<string>('ENABLE_SWAGGER') === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('OrderFlow API')
      .setDescription('API de demonstração para pedidos, estoque, carrinho e autenticação segura.')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addCookieAuth('access_token', { type: 'apiKey', in: 'cookie' }, 'access_token')
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = config.get<number>('PORT') ?? 3001;
  await app.listen(port, '0.0.0.0');
  Logger.log(`OrderFlow API iniciada na porta ${port}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('Falha ao iniciar a API.', error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
