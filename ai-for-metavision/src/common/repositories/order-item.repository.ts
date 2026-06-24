import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { OrderItem } from '@prisma/client';
import { BaseRepository } from './base.repository';

@Injectable()
export class OrderItemRepository extends BaseRepository<OrderItem> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async findAll(): Promise<OrderItem[]> {
    return this.prisma.orderItem.findMany();
  }

  async findById(id: string): Promise<OrderItem | null> {
    return this.prisma.orderItem.findUnique({
      where: { id },
    });
  }

  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.prisma.orderItem.findMany({
      where: { orderId },
      include: { menuItem: true },
    });
  }

  async create(data: {
    orderId: string;
    menuId: string;
    quantity: number;
    price: number;
  }): Promise<OrderItem> {
    return this.prisma.orderItem.create({
      data,
    });
  }

  async update(
    id: string,
    data: Partial<{
      quantity: number;
      price: number;
    }>,
  ): Promise<OrderItem> {
    return this.prisma.orderItem.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.orderItem.delete({
      where: { id },
    });
    return true;
  }
}
