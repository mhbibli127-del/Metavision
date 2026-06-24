import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueueModule } from './config/queue/queue.module';
import { OperationalBridgeModule } from './config/operational-bridge/operational-bridge.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { DataIngestionModule } from './modules/data-ingestion/data-ingestion.module';
import { GatewayModule } from './modules/gateway/gateway.module';

/**
 * Intelligence-only worker — operational CRUD lives in Next.js + MongoDB.
 * NestJS handles AI, forecasts, queues, and WebSocket gateway.
 */
@Module({
  imports: [
    OperationalBridgeModule,
    QueueModule,
    AnalyticsModule,
    AiModule,
    DataIngestionModule,
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
