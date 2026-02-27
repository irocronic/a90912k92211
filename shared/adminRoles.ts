export type UserRole = "user" | "content_editor" | "super_admin" | "admin";

export type AdminPermission =
  | "products:write"
  | "articles:write"
  | "content:write"
  | "settings:write"
  | "localization:write"
  | "storage:upload"
  | "audit:read"
  | "system:notify";

const CONTENT_EDITOR_PERMISSIONS = new Set<AdminPermission>([
  "articles:write",
  "content:write",
  "localization:write",
  "storage:upload",
]);

export function isSuperAdminRole(role: unknown): boolean {
  return role === "super_admin" || role === "admin";
}

export function isContentEditorRole(role: unknown): boolean {
  return role === "content_editor";
}

export function isAdminRole(role: unknown): boolean {
  return isSuperAdminRole(role) || isContentEditorRole(role);
}

export function hasAdminPermission(
  role: unknown,
  permission: AdminPermission,
): boolean {
  if (isSuperAdminRole(role)) return true;
  if (!isContentEditorRole(role)) return false;
  return CONTENT_EDITOR_PERMISSIONS.has(permission);
}
