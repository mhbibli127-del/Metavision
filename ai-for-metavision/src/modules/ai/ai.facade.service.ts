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
import { LlmService } from './llm.service';

@Injectable()
export class AiFacadeService {
  constructor(
    private readonly contextEngine: ContextEngine,
    private readonly behaviorEngine: BehaviorEngine,
    private readonly decisionEngine: DecisionEngine,
    private readonly memoryEngine: MemoryEngine,
    private readonly llm: LlmService,
  ) {}

  async chat(chatRequest: ChatRequestDto): Promise<object> {
    const context = await this.contextEngine.buildContext(
      chatRequest.userId,
      chatRequest.restaurantId,
    );

    const conversationId = `chat:${chatRequest.userId}:${Date.now()}`;

    // Retrieve conversation history for continuity
    const history = await this.memoryEngine.getConversationHistory(conversationId);

    await this.memoryEngine.addToConversationHistory(conversationId, {
      type: 'user',
      message: chatRequest.message,
    });

    // Phase 2: real LLM orchestration
    const systemPrompt = this.llm.buildSystemPrompt(context);
    const userMessage = { role: 'user' as const, content: chatRequest.message };
    const llmResult = await this.llm.complete([systemPrompt, userMessage]);

    let parsedAnswer: { answer?: string; confidence?: number; reasoning?: string } = {};
    try {
      parsedAnswer = JSON.parse(llmResult.text);
    } catch {
      parsedAnswer = { answer: llmResult.text, confidence: llmResult.confidence, reasoning: llmResult.reasoning };
    }

    const response = parsedAnswer.answer ?? llmResult.text;

    await this.memoryEngine.addToConversationHistory(conversationId, {
      type: 'assistant',
      message: response,
    });

    return {
      userId: chatRequest.userId,
      message: chatRequest.message,
      response,
      confidence: parsedAnswer.confidence ?? llmResult.confidence,
      reasoning: parsedAnswer.reasoning ?? llmResult.reasoning,
      context,
      conversationId,
      timestamp: new Date(),
    };
  }

  async recommend(recommendationRequest: RecommendationRequestDto): Promise<object[]> {
    const recommendations = await this.decisionEngine.generateRecommendations(
      recommendationRequest.userId,
      recommendationRequest.restaurantId,
      recommendationRequest.limit || 5,
    );

    await this.memoryEngine.storeUserPreference(
      recommendationRequest.userId,
      'lastRecommendations',
      { restaurantId: recommendationRequest.restaurantId, recommendations, timestamp: new Date() },
    );

    return recommendations;
  }

  async forecast(forecastRequest: ForecastRequestDto): Promise<object> {
    const days = forecastRequest.days || 7;
    const forecast = [];

    // Phase 7: incident-aware forecasting
    const now = new Date();
    const isRainSeason = now.getMonth() >= 9 && now.getMonth() <= 11;

    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseOrders = isWeekend ? 60 : 38;
      const baseRevenue = isWeekend ? 2400 : 1600;
      const incidentFactor = isRainSeason ? 0.77 : 1;

      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedOrders: Math.round((baseOrders + Math.random() * 20 - 10) * incidentFactor),
        predictedRevenue: Math.round((baseRevenue + Math.random() * 400 - 200) * incidentFactor),
        confidence: isRainSeason ? 0.71 : 0.82,
        incidentAdjusted: isRainSeason,
      });
    }

    await this.memoryEngine.cacheAnalyticsResult(forecastRequest.restaurantId, {
      days,
      forecast,
      generatedAt: new Date(),
    });

    return {
      restaurantId: forecastRequest.restaurantId,
      days,
      forecast,
      generatedAt: new Date(),
      modelVersion: '2.0',
    };
  }

  async insight(insightRequest: InsightRequestDto): Promise<object> {
    const insights = await this.decisionEngine.generateInsights(insightRequest.restaurantId);
    const insightItems = (insights as any).insights || [];
    const filteredInsights = insightRequest.dataType
      ? insightItems.filter((i: any) => i.type === insightRequest.dataType)
      : insightItems;

    return {
      restaurantId: insightRequest.restaurantId,
      dataType: insightRequest.dataType,
      timeRange: insightRequest.timeRange || 'monthly',
      insights: filteredInsights,
      generatedAt: new Date(),
    };
  }

  /** Phase 3: actionable decision plan */
  async getActionPlan(restaurantId: string): Promise<object> {
    return this.decisionEngine.generateActionPlan(restaurantId);
  }

  async getUserBehaviorAnalysis(userId: string): Promise<object> {
    return this.behaviorEngine.analyzeBehavior(userId);
  }
}
