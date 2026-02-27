import { type AdminPermission, hasAdminPermission, isAdminRole, isSuperAdminRole } from "@shared/adminRoles";
import { TRPCError } from "@trpc/server";
import { auditLogs } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure } from "./trpc";

type AuditLogStatus = "success" | "error" | "denied";

type AuditLogInput = {
  actorUserId: number;
  actorRole: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  status: AuditLogStatus;
  metadata?: Record<string, unknown>;
};

function truncateString(value: string, max = 500): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max)}...`;
}

function compactAuditValue(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (depth > 3) return "[truncated]";

  if (typeof value === "string") return truncateString(value, 500);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();

  if (typeof Buffer !== "undefined" && Buffer.isBuffer(value)) {
    return `[buffer:${value.length}]`;
  }
  if (value instanceof Uint8Array) {
    return `[uint8array:${value.byteLength}]`;
  }

  if (Array.isArray(value)) {
    const limited = value.slice(0, 20).map((item) => compactAuditValue(item, depth + 1));
    if (value.length > 20) {
      limited.push(`[+${value.length - 20} items]`);
    }
    return limited;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    const trimmedKeys = keys.slice(0, 30);
    const compacted: Record<string, unknown> = {};
    trimmedKeys.forEach((key) => {
      compacted[key] = compactAuditValue(record[key], depth + 1);
    });
    if (keys.length > trimmedKeys.length) {
      compacted.__truncatedKeys = keys.length - trimmedKeys.length;
    }
    return compacted;
  }

  return String(value);
}

function inferResource(path: string): string {
  const segments = path.split(".");
  if (segments[0] === "admin" || segments[0] === "i18n" || segments[0] === "system") {
    return segments[1] ?? segments[0];
  }
  return segments[0] ?? "unknown";
}

function normalizeAuditMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) return undefined;
  return compactAuditValue(metadata) as Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditLogInput): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(auditLogs).values({
      actorUserId: entry.actorUserId,
      actorRole: truncateString(entry.actorRole, 32),
      action: truncateString(entry.action, 191),
      resource: truncateString(entry.resource, 128),
      resourceId: entry.resourceId ? truncateString(entry.resourceId, 128) : null,
      status: entry.status,
      metadata: normalizeAuditMetadata(entry.metadata),
      createdAt: new Date(),
    });
  } catch (error) {
    console.warn("[Audit] Failed to write audit log", error);
  }
}

export const adminProcedure = protectedProcedure.use(async (opts) => {
  const { ctx, next, path, type } = opts;

  if (!ctx.user || !isAdminRole(ctx.user.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Yeterli admin yetkiniz bulunmuyor.",
    });
  }

  const result = await next();

  if (type === "mutation") {
    const errorCode =
      !result.ok
        ? (result.error as any)?.code ??
          (result.error as any)?.data?.code ??
          (result.error as any)?.shape?.data?.code
        : undefined;
    const status: AuditLogStatus = result.ok
      ? "success"
      : errorCode === "FORBIDDEN"
        ? "denied"
        : "error";

    await writeAuditLog({
      actorUserId: ctx.user.id,
      actorRole: String(ctx.user.role),
      action: `mutation:${path}`,
      resource: inferResource(path),
      status,
      metadata: {
        input: compactAuditValue((opts as any).input ?? (opts as any).rawInput),
        errorCode: errorCode ? String(errorCode) : undefined,
        error: result.ok ? undefined : truncateString(result.error.message, 500),
      },
    });
  }

  return result;
});

export function createPermissionProcedure(permission: AdminPermission) {
  return adminProcedure.use(async (opts) => {
    const { ctx } = opts;

    if (!hasAdminPermission(ctx.user.role, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Bu işlem için yetkiniz yok.",
      });
    }

    return opts.next();
  });
}

export const superAdminProcedure = adminProcedure.use(async (opts) => {
  if (!isSuperAdminRole(opts.ctx.user.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Bu işlem sadece super admin için kullanılabilir.",
    });
  }
  return opts.next();
});
