import { connectDb } from "@/lib/mongodb";
import { OrganizationModel, BranchModel, MembershipModel, doc } from "@/lib/models";
import { isAdminPhone } from "@/lib/admin";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "org";
}

/** Ensures org/branch/membership exist for a user+restaurant pair (idempotent). */
export async function ensureTenantForUser(
  userId: string,
  restaurantId: string,
  displayName: string,
  phone: string,
): Promise<{ organizationId: string; branchId: string }> {
  await connectDb();

  let membership = doc(
    await MembershipModel.findOne({ userId }).lean() as { _id: string } & Record<string, unknown>,
  );

  if (membership) {
    const branch = doc(
      await BranchModel.findOne({ organizationId: membership.organizationId, restaurantId }).lean() as {
        _id: string;
      } & Record<string, unknown>,
    );
    if (branch) {
      return { organizationId: String(membership.organizationId), branchId: branch.id };
    }
  }

  const orgName = `${displayName} Group`;
  let org = doc(
    await OrganizationModel.findOne({ ownerId: userId }).lean() as { _id: string } & Record<string, unknown>,
  );

  if (!org) {
    const baseSlug = slugify(displayName);
    let slug = baseSlug;
    let n = 1;
    while (await OrganizationModel.exists({ slug })) {
      slug = `${baseSlug}-${n++}`;
    }
    const created = await OrganizationModel.create({
      name: orgName,
      slug,
      plan: "STANDARD",
      ownerId: userId,
    });
    org = doc(created.toObject())!;
  }

  let branch = doc(
    await BranchModel.findOne({ restaurantId }).lean() as { _id: string } & Record<string, unknown>,
  );

  if (!branch) {
    const created = await BranchModel.create({
      organizationId: org.id,
      restaurantId,
      name: `${displayName} — Main`,
      city: "Baku",
      isPrimary: true,
    });
    branch = doc(created.toObject())!;
  }

  if (!membership) {
    await MembershipModel.create({
      userId,
      organizationId: org.id,
      branchId: branch.id,
      role: isAdminPhone(phone) ? "OWNER" : "OWNER",
      permissions: "[]",
    });
  }

  return { organizationId: org.id, branchId: branch.id };
}
