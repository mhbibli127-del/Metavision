export class CreateOrderDto {
  userId: string;
  restaurantId: string;
  items: Array<{
    menuId: string;
    quantity: number;
    price: number;
  }>;
}
