import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsFilterDto } from './dto';

@UseGuards(ApiKeyGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('restaurant/:restaurantId/revenue')
  async getRestaurantRevenue(@Param('restaurantId') restaurantId: string) {
    return this.analyticsService.getRestaurantRevenue(restaurantId);
  }

  @Get('restaurant/:restaurantId/popular-items')
  async getPopularMenuItems(@Param('restaurantId') restaurantId: string) {
    return this.analyticsService.getPopularMenuItems(restaurantId);
  }

  @Get('restaurant/:restaurantId/daily-stats')
  async getDailyStats(@Param('restaurantId') restaurantId: string) {
    return this.analyticsService.getDailyStats(restaurantId);
  }

  @Get('user/:userId/order-history')
  async getUserOrderHistory(@Param('userId') userId: string) {
    return this.analyticsService.getUserOrderHistory(userId);
  }

  @Get('orders/stats')
  async getOrderStats(@Query() filter: AnalyticsFilterDto) {
    return this.analyticsService.getOrderStats(filter);
  }

  @Get('restaurants/comparison')
  async getRestaurantComparison() {
    return this.analyticsService.getRestaurantComparison();
  }
}
