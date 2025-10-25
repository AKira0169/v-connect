import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/AllExceptionsFilter.filter';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const corsOptions: CorsOptions = {
    origin:
      // before: configService.get('NODE_ENV') === 'development'
      configService.getOrThrow<string>('NODE_ENV') === 'development'
        ? true
        : configService.getOrThrow<string>('ALLOWED_ORIGINS').split(','),
    credentials: true,
  };

  app.use(cookieParser());
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      disableErrorMessages:
        configService.getOrThrow('NODE_ENV') !== 'development',
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new AllExceptionsFilter(configService));

  app.enableCors(corsOptions);

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap().catch((error) => {
  console.error(error);
});
