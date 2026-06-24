import { Module } from '@nestjs/common';
import { QueueModule } from '@/config/queue/queue.module';
import { TasteMindGateway } from './tastemind.gateway';

@Module({
  imports: [QueueModule],
  providers: [TasteMindGateway],
  exports: [TasteMindGateway],
})
export class GatewayModule {}
