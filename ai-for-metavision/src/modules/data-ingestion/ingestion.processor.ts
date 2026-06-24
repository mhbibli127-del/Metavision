import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QueueName, QueueJobName } from '@/config/queue/queue.types';
import { DataIngestionService } from './data-ingestion.service';

@Processor(QueueName.INGESTION)
export class IngestionProcessor {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(private readonly ingestion: DataIngestionService) {}

  @Process(QueueJobName.INGEST_TRENDS)
  async handleIngestTrends(job: Job) {
    this.logger.log(`Processing ${job.name}`);
    await this.ingestion.ingestTrends();
    await job.progress(100);
  }

  @Process(QueueJobName.PROCESS_SIGNALS)
  async handleProcessSignals(job: Job) {
    this.logger.log(`Processing ${job.name}`);
    await this.ingestion.processSignals();
    await job.progress(100);
  }

  @Process(QueueJobName.UPDATE_TASTE_DNA)
  async handleUpdateTasteDna(job: Job<{ userId: string }>) {
    this.logger.log(`Processing ${job.name} for user: ${job.data.userId}`);
    await this.ingestion.updateTasteDna(job.data.userId);
    await job.progress(100);
  }
}
