import { Injectable } from '@nestjs/common';
import { OperationalBridgeService } from '@/config/operational-bridge/operational-bridge.service';
import { AnalyticsFilterDto } from './dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly bridge: OperationalBridgeService) {}

  async getRestaurantRevenue(restaurantId: string): Promise<object> {
    const orders = await this.bridge.fetchOrdersByRestaurant(restaurantId);
    const completedOrders = orders.filter((o) => o.status === 'completed' || o.status === 'delivered');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);

    return {
      restaurantId,
      totalRevenue,
      completedOrders: completedOrders.length,
      pendingOrders: orders.filter((o) => o.status === 'pending').length,
      cancelledOrders: orders.filter((o) => o.status === 'cancelled').length,
      averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
      source: 'next-mongo',
    };
  }

  async getPopularMenuItems(restaurantId: string): Promise<object[]> {
    const menuItems = await this.bridge.fetchMenuItems(restaurantId);
    const orders = await this.bridge.fetchOrdersByRestaurant(restaurantId);
    const itemSales = new Map<string, { count: number; item: (typeof menuItems)[0] | null }>();

    for (const order of orders) {
      for (const item of order.items ?? []) {
        const menuId = item.menuId ?? 'unknown';
        const existing = itemSales.get(menuId) || { count: 0, item: null };
        existing.count += item.quantity;
        if (!existing.item) {
          existing.item = menuItems.find((m) => m.id === menuId) ?? null;
        }
        itemSales.set(menuId, existing);
      }
    }

    return Array.from(itemSales.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((sale) => ({ ...sale.item, salesCount: sale.count }));
  }

  async getUserOrderHistory(userId: string, restaurantId?: string): Promise<object> {
    const orders = restaurantId ? await this.bridge.fetchOrdersByUser(userId, restaurantId) : [];
    const totalSpent = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const completedOrders = orders.filter((o) => o.status === 'completed' || o.status === 'delivered');

    return {
      userId,
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      totalSpent,
      averageOrderValue: orders.length > 0 ? totalSpent / orders.length : 0,
      orders: orders.map((o) => ({
        id: o.id,
        restaurantId: o.restaurantId,
        totalPrice: o.totalPrice,
        status: o.status,
        createdAt: o.createdAt,
      })),
    };
  }

  async getOrderStats(filter?: AnalyticsFilterDto): Promise<object> {
    const restaurantId = filter?.restaurantId;
    if (!restaurantId) {
      return { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, byStatus: {} };
    }

    let orders = await this.bridge.fetchOrdersByRestaurant(restaurantId);
    if (filter?.userId) orders = orders.filter((o) => o.userId === filter.userId);
    if (filter?.status) orders = orders.filter((o) => o.status === filter.status);
    if (filter?.startDate) {
      orders = orders.filter((o) => new Date(o.createdAt) >= filter.startDate!);
    }
    if (filter?.endDate) {
      orders = orders.filter((o) => new Date(o.createdAt) <= filter.endDate!);
    }

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const statuses = new Map<string, number>();
    for (const order of orders) {
      statuses.set(order.status, (statuses.get(order.status) || 0) + 1);
    }

    return {
      totalOrders: orders.length,
      totalRevenue,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      byStatus: Object.fromEntries(statuses),
    };
  }

  async getDailyStats(restaurantId: string): Promise<object[]> {
    const orders = await this.bridge.fetchOrdersByRestaurant(restaurantId);
    const dailyStats = new Map<string, { revenue: number; count: number }>();

    for (const order of orders) {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      const existing = dailyStats.get(date) || { revenue: 0, count: 0 };
      existing.revenue += order.totalPrice;
      existing.count += 1;
      dailyStats.set(date, existing);
    }

    return Array.from(dailyStats.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({
        date,
        revenue: stats.revenue,
        orders: stats.count,
        averageOrderValue: stats.count > 0 ? stats.revenue / stats.count : 0,
      }));
  }

  async getRestaurantComparison(): Promise<object[]> {
    return [];
  }
}
