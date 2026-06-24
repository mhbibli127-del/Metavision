import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      errorFormat: 'pretty',
      log: ['info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✓ Database connected');
    } catch (err) {
      console.warn('⚠ Database unavailable — AI/Redis/WS still run; ingestion needs PostgreSQL');
      console.warn(err instanceof Error ? err.message : err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
