import { Injectable, Logger } from '@nestjs/common';

export type BridgeOrder = {
  id: string;
  userId?: string;
  restaurantId: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  items?: Array<{ menuId?: string; category?: string; quantity: number }>;
};

export type BridgeMenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
};

export type OpsSnapshot = {
  user?: { id: string; email?: string; name?: string; role?: string };
  restaurant?: { id: string; name: string; address?: string };
  orders: BridgeOrder[];
  menuItems: BridgeMenuItem[];
};

/**
 * Fetches operational data from Next.js (Mongo) — Postgres repos are not used in intelligence-only mode.
 */
@Injectable()
export class OperationalBridgeService {
  private readonly logger = new Logger(OperationalBridgeService.name);
  private readonly baseUrl = process.env.NEXT_OPERATIONS_URL || 'http://localhost:3000';
  private readonly apiKey = process.env.AI_API_KEY || '';

  async fetchSnapshot(restaurantId: string, userId?: string): Promise<OpsSnapshot> {
    const empty: OpsSnapshot = { orders: [], menuItems: [] };
    try {
      const params = new URLSearchParams({ restaurantId });
      if (userId) params.set('userId', userId);
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (this.apiKey) headers['x-ai-key'] = this.apiKey;

      const res = await fetch(`${this.baseUrl}/api/intelligence/ops-snapshot?${params}`, {
        headers,
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) {
        this.logger.warn(`ops-snapshot ${res.status} for restaurant ${restaurantId}`);
        return empty;
      }
      const data = (await res.json()) as OpsSnapshot;
      return {
        user: data.user,
        restaurant: data.restaurant,
        orders: Array.isArray(data.orders) ? data.orders : [],
        menuItems: Array.isArray(data.menuItems) ? data.menuItems : [],
      };
    } catch (err) {
      this.logger.warn(`ops-snapshot failed: ${err instanceof Error ? err.message : err}`);
      return empty;
    }
  }

  async fetchOrdersByUser(userId: string, restaurantId?: string): Promise<BridgeOrder[]> {
    if (restaurantId) {
      const snap = await this.fetchSnapshot(restaurantId, userId);
      return snap.orders.filter((o) => !o.userId || o.userId === userId);
    }
    return [];
  }

  async fetchOrdersByRestaurant(restaurantId: string): Promise<BridgeOrder[]> {
    const snap = await this.fetchSnapshot(restaurantId);
    return snap.orders;
  }

  async fetchMenuItems(restaurantId: string): Promise<BridgeMenuItem[]> {
    const snap = await this.fetchSnapshot(restaurantId);
    return snap.menuItems;
  }
}
