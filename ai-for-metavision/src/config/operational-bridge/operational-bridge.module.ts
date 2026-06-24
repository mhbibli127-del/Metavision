import { Global, Module } from '@nestjs/common';
import { OperationalBridgeService } from './operational-bridge.service';

@Global()
@Module({
  providers: [OperationalBridgeService],
  exports: [OperationalBridgeService],
})
export class OperationalBridgeModule {}
