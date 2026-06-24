import { Injectable } from '@nestjs/common';
import {
  ContextEngine,
  BehaviorEngine,
  DecisionEngine,
  MemoryEngine,
} from './engines';
import {
  ChatRequestDto,
  InsightRequestDto,
  RecommendationRequestDto,
  ForecastRequestDto,
} from './dto';

@Injectable()
export class AiService {
  constructor(
    private contextEngine: ContextEngine,
    private behaviorEngine: BehaviorEngine,
    private decisionEngine: DecisionEngine,
    private memoryEngine: MemoryEngine,
  ) {}

  async chat(chatRequest: ChatRequestDto): Promise<object> {
    // Build context from user data
    const context = await this.contextEngine.buildContext(
      chatRequest.userId,
      chatRequest.restaurantId,
    );

    // Retrieve conversation history
    const conversationId = `chat:${chatRequest.userId}:${Date.now()}`;
    const history = await this.memoryEngine.getConversationHistory(conversationId);

    // Store message in history
    await this.memoryEngine.addToConversationHistory(conversationId, {
      type: 'user',
      message: chatRequest.message,
    });

    // Generate response (stub - would connect to LLM)
    const response = `Processed: ${chatRequest.message}`;

    // Store response in history
    await this.memoryEngine.addToConversationHistory(conversationId, {
      type: 'assistant',
      message: response,
    });

    return {
      userId: chatRequest.userId,
      message: chatRequest.message,
      response,
      context,
      conversationId,
      timestamp: new Date(),
    };
  }

  async getInsights(insightRequest: InsightRequestDto): Promise<object> {
    // Generate insights based on data type
    const insights = await this.decisionEngine.generateInsights(
      insightRequest.restaurantId,
    );

    // Filter by data type if specified
    const filteredInsights = insightRequest.dataType
      ? (insights as any).insights.filter((i: any) => i.type === insightRequest.dataType)
      : (insights as any).insights;

    return {
      restaurantId: insightRequest.restaurantId,
      dataType: insightRequest.dataType,
      timeRange: insightRequest.timeRange || 'monthly',
      insights: filteredInsights,
      generatedAt: new Date(),
    };
  }

  async getRecommendations(
    recommendationRequest: RecommendationRequestDto,
  ): Promise<object[]> {
    // Generate personalized recommendations
    const recommendations = await this.decisionEngine.generateRecommendations(
      recommendationRequest.userId,
      recommendationRequest.restaurantId,
      recommendationRequest.limit || 5,
    );

    // Store recommendation in user memory
    await this.memoryEngine.storeUserPreference(
      recommendationRequest.userId,
      'lastRecommendations',
      {
        restaurantId: recommendationRequest.restaurantId,
        recommendations,
        timestamp: new Date(),
      },
    );

    return recommendations;
  }

  async getForecast(forecastRequest: ForecastRequestDto): Promise<object> {
    // Get behavior insights for forecasting
    // TODO: Implement actual forecasting algorithm
    const days = forecastRequest.days || 7;
    const forecast = [];

    // Simple stub forecast - would use ML model
    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedOrders: Math.floor(Math.random() * 50) + 10,
        predictedRevenue: Math.floor(Math.random() * 2000) + 500,
        confidence: 0.75,
      });
    }

    return {
      restaurantId: forecastRequest.restaurantId,
      days,
      forecast,
      generatedAt: new Date(),
      modelVersion: '1.0',
    };
  }

  async getUserBehaviorAnalysis(userId: string): Promise<object> {
    return this.behaviorEngine.analyzeBehavior(userId);
  }

  async buildUserContext(userId: string, restaurantId?: string): Promise<object> {
    return this.contextEngine.buildContext(userId, restaurantId);
  }
}
