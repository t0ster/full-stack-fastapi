import type { Permission } from "@/client"

type Permissions = readonly Permission[] | null | undefined

export function hasPermission(
  permissions: Permissions,
  permission: Permission,
): boolean {
  return permissions?.includes(permission) ?? false
}
