import { connectDb } from "@/lib/mongodb";
import { OrderModel, doc } from "@/lib/models";
import { getDbUser } from "@/lib/db/session";
import { writeAuditLog } from "@/lib/enterprise/audit";
import { notifyRestaurantUpdate } from "@/lib/notify";
import type { OrderStatus } from "@/lib/prisma-types";

const UI_TO_DB: Record<string, OrderStatus> = {
  Pending: "PENDING",
  Preparing: "PREPARING",
  Completed: "COMPLETED",
  Cancelled: "CANCELLED",
};

export async function updateOrderStatus(
  orderNumber: string,
  status: string,
  audit: {
    userId: string;
    restaurantId: string;
    organizationId?: string;
    branchId?: string;
    ip?: string;
  },
) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const dbStatus = UI_TO_DB[status] ?? (status.toUpperCase() as OrderStatus);
  await connectDb();

  const updated = doc(
    await OrderModel.findOneAndUpdate(
      { userId: user.id, orderNumber: orderNumber.replace(/^#/, "") },
      { $set: { status: dbStatus } },
      { new: true },
    ).lean(),
  );

  if (!updated) throw new Error("Order not found");

  await writeAuditLog({
    ...audit,
    action: "UPDATE",
    entity: "order",
    entityId: String(updated.orderNumber),
    summary: `Status → ${dbStatus}`,
  });

  await notifyRestaurantUpdate(audit.restaurantId, "order.updated", {
    orderNumber: updated.orderNumber,
    status: dbStatus,
  });

  return { orderNumber: updated.orderNumber, status: dbStatus };
}
