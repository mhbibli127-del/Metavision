import { Module } from '@nestjs/common';
import { PrismaModule } from '@/config/prisma.module';
import { UserRepository } from './user.repository';
import { RestaurantRepository } from './restaurant.repository';
import { MenuItemRepository } from './menu-item.repository';
import { OrderRepository } from './order.repository';
import { OrderItemRepository } from './order-item.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    UserRepository,
    RestaurantRepository,
    MenuItemRepository,
    OrderRepository,
    OrderItemRepository,
  ],
  exports: [
    UserRepository,
    RestaurantRepository,
    MenuItemRepository,
    OrderRepository,
    OrderItemRepository,
  ],
})
export class RepositoriesModule {}
