import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { Order, OrderItem } from '@prisma/client';
import { BaseRepository } from './base.repository';

export type OrderWithItems = Order & { items: OrderItem[] };

@Injectable()
export class OrderRepository extends BaseRepository<Order> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async findAll(): Promise<OrderWithItems[]> {
    return this.prisma.order.findMany({
      include: { items: true, user: true, restaurant: true },
    });
  }

  async findById(id: string): Promise<OrderWithItems | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true, user: true, restaurant: true },
    });
  }

  async findByUserId(userId: string): Promise<OrderWithItems[]> {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
    });
  }

  async findByRestaurantId(restaurantId: string): Promise<OrderWithItems[]> {
    return this.prisma.order.findMany({
      where: { restaurantId },
      include: { items: true },
    });
  }

  async create(data: {
    userId: string;
    restaurantId: string;
    totalPrice?: number;
    status?: string;
  }): Promise<Order> {
    return this.prisma.order.create({
      data,
    });
  }

  async update(
    id: string,
    data: Partial<{
      totalPrice: number;
      status: string;
    }>,
  ): Promise<Order> {
    return this.prisma.order.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.order.delete({
      where: { id },
    });
    return true;
  }
}
