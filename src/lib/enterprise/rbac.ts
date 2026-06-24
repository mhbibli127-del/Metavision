export type AppRole = "OWNER" | "MANAGER" | "CHEF" | "WAITER" | "ACCOUNTANT" | "USER";

export type Permission =
  | "menu:read"
  | "menu:write"
  | "staff:read"
  | "staff:write"
  | "inventory:read"
  | "inventory:write"
  | "tables:read"
  | "tables:write"
  | "customers:read"
  | "customers:write"
  | "restaurant:read"
  | "restaurant:write"
  | "orders:read"
  | "orders:write"
  | "reservations:read"
  | "reservations:write"
  | "reports:read"
  | "ai:read"
  | "admin:platform";

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  OWNER: [
    "menu:read", "menu:write", "staff:read", "staff:write",
    "inventory:read", "inventory:write", "tables:read", "tables:write",
    "customers:read", "customers:write", "restaurant:read", "restaurant:write",
    "orders:read", "orders:write", "reservations:read", "reservations:write", "reports:read", "ai:read", "admin:platform",
  ],
  MANAGER: [
    "menu:read", "menu:write", "staff:read", "staff:write",
    "inventory:read", "inventory:write", "tables:read", "tables:write",
    "customers:read", "customers:write", "restaurant:read", "restaurant:write",
    "orders:read", "orders:write", "reservations:read", "reservations:write", "reports:read", "ai:read",
  ],
  CHEF: ["menu:read", "menu:write", "inventory:read", "inventory:write", "orders:read", "orders:write"],
  WAITER: ["menu:read", "tables:read", "tables:write", "orders:read", "orders:write", "reservations:read", "reservations:write", "customers:read"],
  ACCOUNTANT: ["orders:read", "reports:read", "customers:read", "restaurant:read"],
  USER: ["menu:read", "orders:read", "tables:read", "customers:read", "restaurant:read"],
};

export function normalizeRole(role: string | undefined, isAdminPhone: boolean): AppRole {
  if (isAdminPhone) return "OWNER";
  const upper = String(role ?? "USER").toUpperCase() as AppRole;
  return upper in ROLE_PERMISSIONS ? upper : "USER";
}

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function assertPermission(role: AppRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error("Forbidden");
  }
}
