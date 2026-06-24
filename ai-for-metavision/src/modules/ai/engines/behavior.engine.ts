import { Injectable } from '@nestjs/common';
import { OperationalBridgeService, type BridgeOrder } from '@/config/operational-bridge/operational-bridge.service';

@Injectable()
export class BehaviorEngine {
  constructor(private readonly bridge: OperationalBridgeService) {}

  async analyzeBehavior(userId: string, restaurantId?: string): Promise<object> {
    const orders = restaurantId
      ? await this.bridge.fetchOrdersByUser(userId, restaurantId)
      : [];

    if (orders.length === 0) {
      return {
        userId,
        orderFrequency: 'new_user',
        categoryPreferences: [],
        spendingTrend: 'insufficient_data',
      };
    }

    const daysSinceFirstOrder = this.calculateDaysDifference(
      new Date(orders[0].createdAt),
      new Date(),
    );
    const orderFrequency = daysSinceFirstOrder > 0 ? (orders.length / daysSinceFirstOrder) * 30 : orders.length;

    return {
      userId,
      totalOrders: orders.length,
      orderFrequencyPerMonth: Math.round(orderFrequency * 10) / 10,
      categoryPreferences: this.getCategoryPreferences(orders),
      spendingTrend: this.calculateSpendingTrend(orders),
      topRestaurants: this.getRestaurantFrequency(orders).slice(0, 3),
      avgOrderValue: Math.round((orders.reduce((sum, o) => sum + o.totalPrice, 0) / orders.length) * 100) / 100,
      lastOrderDaysAgo: this.calculateDaysDifference(new Date(orders[orders.length - 1].createdAt), new Date()),
    };
  }

  async predictBehavior(userId: string, _context: object, restaurantId?: string): Promise<object> {
    const behavior = await this.analyzeBehavior(userId, restaurantId);
    const orders = restaurantId ? await this.bridge.fetchOrdersByUser(userId, restaurantId) : [];

    return {
      likelyToOrder: orders.length > 0,
      predictedSpending: (behavior as { avgOrderValue?: number }).avgOrderValue || 0,
      bestTimeToReach: this.getPeakOrderTime(orders),
      churnRisk: this.calculateChurnRisk(orders),
    };
  }

  private getCategoryPreferences(orders: BridgeOrder[]): object[] {
    const categoryMap = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.items ?? []) {
        const category = item.category || 'uncategorized';
        categoryMap.set(category, (categoryMap.get(category) || 0) + item.quantity);
      }
    }
    return Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, orders: count }));
  }

  private calculateSpendingTrend(orders: BridgeOrder[]): string {
    if (orders.length < 2) return 'insufficient_data';
    const recent = orders.slice(-5).reduce((sum, o) => sum + o.totalPrice, 0);
    const older = orders.slice(0, 5).reduce((sum, o) => sum + o.totalPrice, 0);
    const recentAvg = recent / Math.min(5, orders.length);
    const olderAvg = older / Math.min(5, orders.length);
    if (recentAvg > olderAvg * 1.2) return 'increasing';
    if (recentAvg < olderAvg * 0.8) return 'decreasing';
    return 'stable';
  }

  private getRestaurantFrequency(orders: BridgeOrder[]): object[] {
    const restaurantMap = new Map<string, number>();
    for (const order of orders) {
      restaurantMap.set(order.restaurantId, (restaurantMap.get(order.restaurantId) || 0) + 1);
    }
    return Array.from(restaurantMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([restaurantId, count]) => ({ restaurantId, orders: count }));
  }

  private getPeakOrderTime(orders: BridgeOrder[]): string {
    const hourMap = new Map<number, number>();
    for (const order of orders) {
      const hour = new Date(order.createdAt).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    }
    let maxHour = 0;
    let maxCount = 0;
    for (const [hour, count] of hourMap.entries()) {
      if (count > maxCount) {
        maxCount = count;
        maxHour = hour;
      }
    }
    if (maxHour >= 5 && maxHour < 12) return 'morning';
    if (maxHour >= 12 && maxHour < 17) return 'afternoon';
    if (maxHour >= 17 && maxHour < 21) return 'evening';
    return 'night';
  }

  private calculateChurnRisk(orders: BridgeOrder[]): 'low' | 'medium' | 'high' {
    if (orders.length === 0) return 'high';
    if (orders.length === 1) return 'high';
    const daysSinceLastOrder = this.calculateDaysDifference(
      new Date(orders[orders.length - 1].createdAt),
      new Date(),
    );
    if (daysSinceLastOrder > 90) return 'high';
    if (daysSinceLastOrder > 30) return 'medium';
    return 'low';
  }

  private calculateDaysDifference(date1: Date, date2: Date): number {
    return Math.ceil(Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
  }
}
