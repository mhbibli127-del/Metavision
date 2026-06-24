import { Module } from '@nestjs/common';
import { OperationalBridgeModule } from '@/config/operational-bridge/operational-bridge.module';
import { QueueModule } from '@/config/queue/queue.module';
import { RedisService } from '@/config/queue/redis.service';
import {
  ContextEngine,
  BehaviorEngine,
  DecisionEngine,
  MemoryEngine,
} from './engines';
import { AiService } from './ai.service';
import { AiFacadeService } from './ai.facade.service';
import { AiController } from './ai.controller';
import { LlmService } from './llm.service';
import { EmbeddingService } from './embedding.service';

@Module({
  imports: [OperationalBridgeModule, QueueModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiFacadeService,
    RedisService,
    ContextEngine,
    BehaviorEngine,
    DecisionEngine,
    MemoryEngine,
    LlmService,
    EmbeddingService,
  ],
  exports: [
    AiService,
    AiFacadeService,
    LlmService,
    EmbeddingService,
    RedisService,
    ContextEngine,
    BehaviorEngine,
    DecisionEngine,
    MemoryEngine,
  ],
})
export class AiModule {}
