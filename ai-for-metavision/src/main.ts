import { config as loadEnv } from 'dotenv';
loadEnv();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getHttpCorsOptions } from '@/config/cors-origins';
import { SocketIoCorsAdapter } from '@/config/socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(getHttpCorsOptions());
  app.useWebSocketAdapter(new SocketIoCorsAdapter(app));

  app.setGlobalPrefix('api');

  const PORT = process.env.PORT || 3001;
  await app.listen(PORT);

  console.log(`✨ AI backend: http://localhost:${PORT}/api`);
  console.log(`✨ WebSocket:   ws://localhost:${PORT}/tastemind`);
}

bootstrap();
