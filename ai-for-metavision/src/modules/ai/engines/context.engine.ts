import { Injectable } from '@nestjs/common';
import { OperationalBridgeService } from '@/config/operational-bridge/operational-bridge.service';

/**
 * Context Engine — builds AI context from Next.js operational data (Mongo).
 */
@Injectable()
export class ContextEngine {
  constructor(private readonly bridge: OperationalBridgeService) {}

  async buildContext(userId: string, restaurantId?: string): Promise<object> {
    const snapshot = restaurantId
      ? await this.bridge.fetchSnapshot(restaurantId, userId)
      : { orders: [], menuItems: [] };

    const userOrders = snapshot.orders;
    const totalSpent = userOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const lastOrder = userOrders.length > 0 ? userOrders[userOrders.length - 1] : null;

    return {
      user: snapshot.user ?? { id: userId },
      restaurant: snapshot.restaurant ?? null,
      history: {
        totalOrders: userOrders.length,
        totalSpent,
        averageOrderValue: userOrders.length > 0 ? totalSpent / userOrders.length : 0,
        lastOrderDate: lastOrder?.createdAt,
      },
      timestamp: new Date(),
      season: this.getSeason(),
      timeOfDay: this.getTimeOfDay(),
      source: 'next-mongo',
    };
  }

  async enrichContext(context: object, data: object): Promise<object> {
    return { ...context, ...data, enrichedAt: new Date() };
  }

  private getSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
}
