import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RedisService } from './redis.service';
import { getRedisConnection } from '../redis.config';

@Module({
  imports: [
    BullModule.forRoot({
      redis: getRedisConnection(),
    }),
  ],
  providers: [RedisService],
  exports: [RedisService, BullModule],
})
export class QueueModule {}
