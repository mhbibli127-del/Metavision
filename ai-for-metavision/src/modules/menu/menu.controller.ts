import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { MenuService } from './menu.service';
import { CreateMenuItemDto, UpdateMenuItemDto } from './dto';

@UseGuards(ApiKeyGuard)
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  async createMenuItem(@Body() createMenuItemDto: CreateMenuItemDto) {
    return this.menuService.createMenuItem(createMenuItemDto);
  }

  @Get()
  async getAllMenuItems() {
    return this.menuService.getAllMenuItems();
  }

  @Get('search')
  async searchMenuItems(
    @Query('restaurantId') restaurantId: string,
    @Query('q') query: string,
  ) {
    return this.menuService.searchMenuItems(restaurantId, query);
  }

  @Get('restaurant/:restaurantId')
  async getRestaurantMenu(@Param('restaurantId') restaurantId: string) {
    return this.menuService.getRestaurantMenu(restaurantId);
  }

  @Get('restaurant/:restaurantId/category/:category')
  async getMenuItemsByCategory(
    @Param('restaurantId') restaurantId: string,
    @Param('category') category: string,
  ) {
    return this.menuService.getMenuItemsByCategory(restaurantId, category);
  }

  @Get(':id')
  async getMenuItemById(@Param('id') id: string) {
    return this.menuService.getMenuItemById(id);
  }

  @Put(':id')
  async updateMenuItem(
    @Param('id') id: string,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
  ) {
    return this.menuService.updateMenuItem(id, updateMenuItemDto);
  }

  @Delete(':id')
  async deleteMenuItem(@Param('id') id: string) {
    return this.menuService.deleteMenuItem(id);
  }
}
