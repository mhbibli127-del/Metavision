export class CreateMenuItemDto {
  name: string;
  description?: string;
  price: number;
  category?: string;
  restaurantId: string;
}
