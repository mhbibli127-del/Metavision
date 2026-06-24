import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { MenuItem } from '@prisma/client';
import { BaseRepository } from './base.repository';

@Injectable()
export class MenuItemRepository extends BaseRepository<MenuItem> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async findAll(): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany();
  }

  async findById(id: string): Promise<MenuItem | null> {
    return this.prisma.menuItem.findUnique({
      where: { id },
    });
  }

  async findByRestaurantId(restaurantId: string): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      where: { restaurantId },
    });
  }

  async create(data: {
    name: string;
    description?: string;
    price: number;
    category?: string;
    restaurantId: string;
  }): Promise<MenuItem> {
    return this.prisma.menuItem.create({
      data,
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      category: string;
    }>,
  ): Promise<MenuItem> {
    return this.prisma.menuItem.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.menuItem.delete({
      where: { id },
    });
    return true;
  }
}
