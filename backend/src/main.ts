import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(process.env.PORT || 3000);
  // No business logic in skeleton
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`Application failed to start: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
