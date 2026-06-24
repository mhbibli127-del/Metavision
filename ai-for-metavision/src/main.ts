import { config as loadEnv } from 'dotenv';
loadEnv();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.WS_ORIGIN?.split(',').map((o) => o.trim()) ?? true,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const PORT = process.env.PORT || 3001;
  await app.listen(PORT);

  console.log(`✨ AI backend: http://localhost:${PORT}/api`);
  console.log(`✨ WebSocket:   ws://localhost:${PORT}/tastemind`);
}

bootstrap();
