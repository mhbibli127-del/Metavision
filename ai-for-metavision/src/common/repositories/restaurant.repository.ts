import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { Restaurant } from '@prisma/client';
import { BaseRepository } from './base.repository';

@Injectable()
export class RestaurantRepository extends BaseRepository<Restaurant> {
  constructor(private prisma: PrismaService) {
    super();
  }

  async findAll(): Promise<Restaurant[]> {
    return this.prisma.restaurant.findMany({
      include: { owner: true },
    });
  }

  async findById(id: string): Promise<Restaurant | null> {
    return this.prisma.restaurant.findUnique({
      where: { id },
      include: { owner: true },
    });
  }

  async findByOwnerId(ownerId: string): Promise<Restaurant[]> {
    return this.prisma.restaurant.findMany({
      where: { ownerId },
    });
  }

  async create(data: {
    name: string;
    address?: string;
    phone?: string;
    ownerId: string;
  }): Promise<Restaurant> {
    return this.prisma.restaurant.create({
      data,
    });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      address: string;
      phone: string;
    }>,
  ): Promise<Restaurant> {
    return this.prisma.restaurant.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.restaurant.delete({
      where: { id },
    });
    return true;
  }
}
