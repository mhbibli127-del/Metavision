import { Module } from '@nestjs/common';
import { RepositoriesModule } from '@/common/repositories/repositories.module';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [RepositoriesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
