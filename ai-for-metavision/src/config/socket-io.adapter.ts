import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplicationContext } from '@nestjs/common';
import type { ServerOptions } from 'socket.io';
import { getSocketCorsConfig } from '@/config/cors-origins';

/**
 * Ensures CORS headers on the Socket.IO engine (/socket.io polling + upgrade).
 * Gateway-level cors alone does not always cover the initial handshake.
 */
export class SocketIoCorsAdapter extends IoAdapter {
  constructor(app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      cors: getSocketCorsConfig(),
      transports: ['polling', 'websocket'],
    });
  }
}
