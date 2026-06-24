import { Injectable } from '@nestjs/common';
import { MenuItem } from '@prisma/client';
import { MenuItemRepository } from '@/common/repositories/menu-item.repository';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto';

@Injectable()
export class MenuService {
  constructor(private menuItemRepository: MenuItemRepository) {}

  async createMenuItem(createMenuItemDto: CreateMenuItemDto): Promise<MenuItem> {
    return this.menuItemRepository.create(createMenuItemDto);
  }

  async getMenuItemById(id: string): Promise<MenuItem | null> {
    return this.menuItemRepository.findById(id);
  }

  async getAllMenuItems(): Promise<MenuItem[]> {
    return this.menuItemRepository.findAll();
  }

  async getRestaurantMenu(restaurantId: string): Promise<MenuItem[]> {
    return this.menuItemRepository.findByRestaurantId(restaurantId);
  }

  async updateMenuItem(
    id: string,
    updateMenuItemDto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    return this.menuItemRepository.update(id, updateMenuItemDto);
  }

  async deleteMenuItem(id: string): Promise<boolean> {
    return this.menuItemRepository.delete(id);
  }

  async getMenuItemsByCategory(
    restaurantId: string,
    category: string,
  ): Promise<MenuItem[]> {
    const items = await this.menuItemRepository.findByRestaurantId(restaurantId);
    return items.filter((item) => item.category === category);
  }

  async searchMenuItems(restaurantId: string, query: string): Promise<MenuItem[]> {
    const items = await this.menuItemRepository.findByRestaurantId(restaurantId);
    const lowerQuery = query.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        (item.description?.toLowerCase().includes(lowerQuery) ?? false),
    );
  }
}
