import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueName } from '@/config/queue/queue.types';
import { PrismaModule } from '@/config/prisma.module';
import { QueueModule } from '@/config/queue/queue.module';
import { WeatherService } from './weather.service';
import { TrendsService } from './trends.service';
import { ExternalSignalsService } from './external-signals.service';
import { DataIngestionService } from './data-ingestion.service';
import { IngestionProcessor } from './ingestion.processor';

@Module({
  imports: [
    PrismaModule,
    QueueModule,
    BullModule.registerQueue({ name: QueueName.INGESTION }),
  ],
  providers: [
    WeatherService,
    TrendsService,
    ExternalSignalsService,
    DataIngestionService,
    IngestionProcessor,
  ],
  exports: [DataIngestionService],
})
export class DataIngestionModule {}
