import { Controller, Post, Get, Body, Param, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { AiFacadeService } from './ai.facade.service';
import {
  ChatRequestDto,
  InsightRequestDto,
  RecommendationRequestDto,
  ForecastRequestDto,
} from './dto';

@UseGuards(ApiKeyGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiFacadeService: AiFacadeService) {}

  @Post('chat')
  async chat(@Body() chatRequest: ChatRequestDto) {
    if (!chatRequest.userId || !chatRequest.message) {
      throw new BadRequestException('userId and message are required');
    }
    return this.aiFacadeService.chat(chatRequest);
  }

  @Post('insight')
  async getInsight(@Body() insightRequest: InsightRequestDto) {
    if (!insightRequest.restaurantId || !insightRequest.dataType) {
      throw new BadRequestException('restaurantId and dataType are required');
    }
    const validDataTypes = ['revenue', 'menu', 'orders', 'trends'];
    if (!validDataTypes.includes(insightRequest.dataType)) {
      throw new BadRequestException(`Invalid dataType. Must be one of: ${validDataTypes.join(', ')}`);
    }
    return this.aiFacadeService.insight(insightRequest);
  }

  @Post('recommend')
  async getRecommendation(@Body() recommendationRequest: RecommendationRequestDto) {
    if (!recommendationRequest.userId || !recommendationRequest.restaurantId) {
      throw new BadRequestException('userId and restaurantId are required');
    }
    if (recommendationRequest.limit && (recommendationRequest.limit < 1 || recommendationRequest.limit > 50)) {
      throw new BadRequestException('limit must be between 1 and 50');
    }
    return this.aiFacadeService.recommend(recommendationRequest);
  }

  @Post('forecast')
  async getForecast(@Body() forecastRequest: ForecastRequestDto) {
    if (!forecastRequest.restaurantId) {
      throw new BadRequestException('restaurantId is required');
    }
    if (forecastRequest.days && (forecastRequest.days < 1 || forecastRequest.days > 90)) {
      throw new BadRequestException('days must be between 1 and 90');
    }
    return this.aiFacadeService.forecast(forecastRequest);
  }

  /** Phase 3 — actionable decision plan */
  @Get('actions/:restaurantId')
  async getActionPlan(@Param('restaurantId') restaurantId: string) {
    if (!restaurantId) throw new BadRequestException('restaurantId is required');
    return this.aiFacadeService.getActionPlan(restaurantId);
  }
}
