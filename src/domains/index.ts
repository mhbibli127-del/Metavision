/**
 * Domain layer map — operational code lives under src/lib until full DDD migration.
 * Import from here for cross-cutting domain boundaries.
 */
export * as organization from "@/lib/enterprise/tenant";
export * as rbac from "@/lib/enterprise/rbac";
export * as audit from "@/lib/enterprise/audit";
export * as operations from "@/lib/db/operations";
export * as intelligence from "@/lib/db/customer-segments";
export * as commands from "@/domains/application/commands";
export * as infrastructure from "@/domains/infrastructure";
