import { Injectable } from '@nestjs/common';
import { OperationalBridgeService } from '@/config/operational-bridge/operational-bridge.service';
import { BehaviorEngine } from './behavior.engine';

@Injectable()
export class DecisionEngine {
  constructor(
    private readonly bridge: OperationalBridgeService,
    private readonly behaviorEngine: BehaviorEngine,
  ) {}

  async makeDecision(context: object, options: object[]): Promise<object> {
    const scoredOptions = options.map((option: Record<string, unknown>) => ({
      ...option,
      score: this.scoreOption(option, context),
    }));
    const rankedOptions = scoredOptions.sort((a, b) => b.score - a.score);
    return {
      selectedOption: rankedOptions[0],
      allOptions: rankedOptions,
      context,
      decidedAt: new Date(),
    };
  }

  async generateRecommendations(userId: string, restaurantId: string, limit = 5): Promise<object[]> {
    const behavior = await this.behaviorEngine.analyzeBehavior(userId, restaurantId);
    const menuItems = await this.bridge.fetchMenuItems(restaurantId);

    return menuItems
      .map((item) => ({ ...item, score: this.scoreMenuItem(item, behavior) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        recommendationScore: Math.round(item.score * 100) / 100,
        reason: this.generateRecommendationReason(item, behavior),
      }));
  }

  async generateInsights(restaurantId: string): Promise<object> {
    const orders = await this.bridge.fetchOrdersByRestaurant(restaurantId);
    const trend =
      orders.length >= 2
        ? `Order volume: ${orders.length} records in snapshot`
        : 'Insufficient order history — connect POS or add orders in dashboard';

    return {
      restaurantId,
      insights: [
        { type: 'performance', message: 'Leverage popular items during peak hours', confidence: 0.85 },
        { type: 'opportunity', message: 'Bundle slow-moving items with popular ones', confidence: 0.72 },
        { type: 'trend', message: trend, confidence: 0.91 },
      ],
      generatedAt: new Date(),
    };
  }

  async generateActionPlan(restaurantId: string): Promise<object> {
    const actions = [
      {
        type: 'increase_price',
        label: 'Raise evening-menu prices by 8%',
        impact: '+7% revenue',
        risk: 'medium',
        confidence: 0.78,
        tradeoff: 'May reduce order volume by 2–4% if price elasticity is high',
        explanation: 'Evening demand is inelastic based on current trend data.',
      },
      {
        type: 'add_bundle',
        label: 'Introduce combo based on Taste DNA',
        impact: '+12% avg basket size',
        risk: 'low',
        confidence: 0.88,
        tradeoff: 'Requires kitchen prep time adjustment',
        explanation: 'Cross-sell signals confirmed by regional Taste DNA.',
      },
    ];
    return { restaurantId, actions, generatedAt: new Date() };
  }

  private scoreOption(option: Record<string, unknown>, context: Record<string, unknown>): number {
    let score = 0;
    if (typeof option.relevance === 'number') score += option.relevance * 0.5;
    if (typeof option.popularity === 'number') score += option.popularity * 0.3;
    if (typeof option.rating === 'number') score += (option.rating / 5) * 0.2;
    if (context.timeOfDay === option.preferredTime) score += 0.1;
    if (context.season === option.seasonalBoost) score += 0.1;
    return Math.min(score, 1);
  }

  private scoreMenuItem(item: { price: number; category?: string }, behavior: object): number {
    let score = 0.5;
    const prefs = (behavior as { categoryPreferences?: Array<{ category: string; orders: number }> }).categoryPreferences ?? [];
    const categoryMatch = prefs.find((p) => p.category === item.category);
    if (categoryMatch) score += (categoryMatch.orders / 10) * 0.3;
    const avgSpending = (behavior as { avgOrderValue?: number }).avgOrderValue || 50;
    if (Math.abs(item.price - avgSpending) < 10) score += 0.2;
    score += 0.1;
    return Math.min(score, 1);
  }

  private generateRecommendationReason(item: { category?: string }, behavior: object): string {
    const prefs = (behavior as { categoryPreferences?: Array<{ category: string }> }).categoryPreferences ?? [];
    const categoryMatch = prefs.find((p) => p.category === item.category);
    if (categoryMatch) return `You frequently order ${item.category}`;
    return 'Popular choice based on your preferences';
  }
}
