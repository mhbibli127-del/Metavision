import { Module } from '@nestjs/common';
import { OperationalBridgeModule } from '@/config/operational-bridge/operational-bridge.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [OperationalBridgeModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
