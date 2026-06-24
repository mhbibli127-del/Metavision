import { connectDb } from "@/lib/mongodb";
import {
  OrganizationModel,
  BranchModel,
  MembershipModel,
  RestaurantModel,
  MenuItemModel,
  doc,
  docs,
} from "@/lib/models";
import { saveMenuTemplateVersion } from "@/lib/db/growth";
import { requireRestaurant, getDbUser } from "@/lib/db/session";

export async function fetchOrganizationProfile() {
  const user = await getDbUser();
  const restaurant = await requireRestaurant();
  if (!user) throw new Error("Unauthorized");

  await connectDb();
  const membership = doc(
    await MembershipModel.findOne({ userId: user.id }).lean() as { _id: string } & Record<string, unknown>,
  );
  if (!membership) return { organization: null, branches: [], currentBranch: null };

  const org = doc(
    await OrganizationModel.findById(membership.organizationId).lean() as { _id: string } & Record<string, unknown>,
  );
  const branches = docs(
    await BranchModel.find({ organizationId: membership.organizationId }).lean(),
  );

  const branchDetails = await Promise.all(
    branches.map(async (b) => {
      const r = await RestaurantModel.findById(b.restaurantId).lean();
      return {
        id: b.id,
        name: b.name,
        city: b.city,
        isPrimary: Boolean(b.isPrimary),
        restaurantId: b.restaurantId,
        address: r ? String(r.address) : "",
        isCurrent: b.restaurantId === restaurant.id,
      };
    }),
  );

  return {
    organization: org
      ? { id: org.id, name: org.name, slug: org.slug, plan: org.plan }
      : null,
    branches: branchDetails,
    currentBranch: branchDetails.find((b) => b.isCurrent) ?? null,
  };
}

export async function createBranch(input: { name: string; city?: string; address?: string }) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  await connectDb();
  const membership = await MembershipModel.findOne({ userId: user.id }).lean();
  if (!membership || String(membership.role) !== "OWNER") {
    throw new Error("Forbidden");
  }

  const restaurant = await RestaurantModel.create({
    userId: user.id,
    organizationId: String(membership.organizationId),
    name: input.name,
    address: input.address ?? `${input.city ?? "Baku"}, Azərbaycan`,
    city: input.city ?? "Baku",
    openingHours: "10:00 – 22:00",
    phone: user.phone,
    email: `${user.firstName.toLowerCase()}@metavision.az`,
    currency: "AZN",
    cuisine: "[]",
    paymentMethods: "[]",
  });

  const branch = await BranchModel.create({
    organizationId: membership.organizationId,
    restaurantId: restaurant._id,
    name: input.name,
    city: input.city ?? "Baku",
    isPrimary: false,
  });

  return fetchOrganizationProfile();
}

export async function copyMenuTemplate(sourceRestaurantId: string, targetRestaurantId: string) {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");

  await connectDb();
  const membership = await MembershipModel.findOne({ userId: user.id }).lean();
  if (!membership || String(membership.role) !== "OWNER") {
    throw new Error("Forbidden");
  }

  const branches = await BranchModel.find({ organizationId: membership.organizationId }).lean();
  const allowedIds = new Set(branches.map((b) => String(b.restaurantId)));
  if (!allowedIds.has(sourceRestaurantId) || !allowedIds.has(targetRestaurantId)) {
    throw new Error("Forbidden");
  }

  const sourceItems = await MenuItemModel.find({ restaurantId: sourceRestaurantId }).lean();
  await MenuItemModel.deleteMany({ restaurantId: targetRestaurantId });

  if (sourceItems.length) {
    await MenuItemModel.insertMany(
      sourceItems.map((item) => ({
        restaurantId: targetRestaurantId,
        name: item.name,
        category: item.category,
        description: item.description,
        price: item.price,
        image: item.image,
        available: item.available,
        featured: item.featured,
        preparationTime: item.preparationTime,
        calories: item.calories,
        tags: item.tags,
        order: item.order,
      })),
    );
  }

  const template = await saveMenuTemplateVersion(
    String(membership.organizationId),
    `branch-${targetRestaurantId}`,
    sourceRestaurantId,
    sourceItems.length,
  );

  return { copied: sourceItems.length, targetRestaurantId, templateVersion: template?.version };
}
