export class InsightRequestDto {
  restaurantId: string;
  dataType: 'revenue' | 'menu' | 'orders' | 'trends';
  timeRange?: 'daily' | 'weekly' | 'monthly';
}
