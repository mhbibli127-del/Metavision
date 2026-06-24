import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Order } from '@prisma/client';
import { OrderRepository } from '@/common/repositories/order.repository';
import { OrderItemRepository } from '@/common/repositories/order-item.repository';
import { CreateOrderDto, UpdateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(
    private orderRepository: OrderRepository,
    private orderItemRepository: OrderItemRepository,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    // Calculate total price
    const totalPrice = createOrderDto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Create order
    const order = await this.orderRepository.create({
      userId: createOrderDto.userId,
      restaurantId: createOrderDto.restaurantId,
      totalPrice,
      status: 'pending',
    });

    // Create order items
    for (const item of createOrderDto.items) {
      await this.orderItemRepository.create({
        orderId: order.id,
        menuId: item.menuId,
        quantity: item.quantity,
        price: item.price,
      });
    }

    const createdOrder = await this.getOrderById(order.id);

    if (!createdOrder) {
      throw new InternalServerErrorException('Created order could not be reloaded');
    }

    return createdOrder;
  }

  async getOrderById(id: string): Promise<Order | null> {
    return this.orderRepository.findById(id);
  }

  async getAllOrders(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return this.orderRepository.findByUserId(userId);
  }

  async getRestaurantOrders(restaurantId: string): Promise<Order[]> {
    return this.orderRepository.findByRestaurantId(restaurantId);
  }

  async updateOrder(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    return this.orderRepository.update(id, updateOrderDto);
  }

  async deleteOrder(id: string): Promise<boolean> {
    return this.orderRepository.delete(id);
  }

  async cancelOrder(id: string): Promise<Order> {
    return this.orderRepository.update(id, { status: 'cancelled' });
  }

  async completeOrder(id: string): Promise<Order> {
    return this.orderRepository.update(id, { status: 'completed' });
  }
}
