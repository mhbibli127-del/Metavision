export class ChatRequestDto {
  userId: string;
  restaurantId?: string;
  message: string;
  context?: Record<string, any>;
}
