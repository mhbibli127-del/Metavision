import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { OrderModel, MenuItemModel, RestaurantModel, UserModel, docs, doc } from "@/lib/models";

function verifyAiKey(request: Request): boolean {
  const key = process.env.AI_API_KEY;
  if (!key) return process.env.NODE_ENV === "development";
  return request.headers.get("x-ai-key") === key;
}

export async function GET(request: Request) {
  if (!verifyAiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const userId = searchParams.get("userId");

  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
  }

  try {
    await connectDb();
    const restaurant = doc(await RestaurantModel.findById(restaurantId).lean());
    const [orders, menuItems] = await Promise.all([
      OrderModel.find({ restaurantId }).sort({ createdAt: -1 }).limit(200).lean(),
      MenuItemModel.find({ restaurantId }).lean(),
    ]);

    let user = null;
    if (userId) {
      const u = doc(await UserModel.findById(userId).lean());
      if (u) {
        user = {
          id: u.id,
          email: String(u.email ?? ""),
          name: `${u.firstName} ${u.lastName}`.trim(),
          role: String(u.role ?? "USER"),
        };
      }
    }

    const mappedOrders = docs(orders as Array<{ _id: string } & Record<string, unknown>>).map((o) => ({
      id: o.id,
      userId: o.userId ? String(o.userId) : undefined,
      restaurantId: String(o.restaurantId),
      totalPrice: Number(o.total ?? o.totalPrice ?? 0),
      status: String(o.status ?? "pending").toLowerCase(),
      createdAt: new Date(String(o.createdAt ?? Date.now())).toISOString(),
      items: Array.isArray(o.items)
        ? (o.items as Array<Record<string, unknown>>).map((item) => ({
            menuId: item.menuItemId ? String(item.menuItemId) : undefined,
            category: item.category ? String(item.category) : undefined,
            quantity: Number(item.quantity ?? 1),
          }))
        : [],
    }));

    const mappedMenu = docs(menuItems as Array<{ _id: string } & Record<string, unknown>>).map((m) => ({
      id: m.id,
      name: String(m.name),
      description: m.description ? String(m.description) : undefined,
      price: Number(m.price ?? 0),
      category: m.category ? String(m.category) : undefined,
    }));

    return NextResponse.json({
      user: user ?? undefined,
      restaurant: restaurant
        ? { id: restaurant.id, name: String(restaurant.name), address: restaurant.address ? String(restaurant.address) : undefined }
        : { id: restaurantId, name: "Restaurant" },
      orders: mappedOrders,
      menuItems: mappedMenu,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
