import { headers } from "next/headers";
import { isAdminPhone } from "@/lib/admin";
import { getDbUser, getUserRestaurant, requireRestaurant } from "@/lib/db/session";
import { connectDb } from "@/lib/mongodb";
import { MembershipModel, doc } from "@/lib/models";
import { assertPermission, normalizeRole, type AppRole, type Permission } from "@/lib/enterprise/rbac";
import { ensureTenantForUser } from "@/lib/enterprise/tenant";

export type AccessContext = {
  userId: string;
  restaurantId: string;
  organizationId: string;
  branchId: string;
  role: AppRole;
  ip: string;
};

export async function requireAccess(permission: Permission): Promise<AccessContext> {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  const restaurant = await requireRestaurant();
  await connectDb();

  const tenant = await ensureTenantForUser(
    user.id,
    restaurant.id,
    user.firstName,
    user.phone,
  );

  const membership = doc(
    await MembershipModel.findOne({ userId: user.id }).lean() as { _id: string } & Record<string, unknown>,
  );

  const role = normalizeRole(
    membership?.role ? String(membership.role) : user.role ? String(user.role) : "USER",
    isAdminPhone(user.phone),
  );

  assertPermission(role, permission);

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";

  return {
    userId: user.id,
    restaurantId: restaurant.id,
    organizationId: tenant.organizationId,
    branchId: tenant.branchId,
    role,
    ip,
  };
}
