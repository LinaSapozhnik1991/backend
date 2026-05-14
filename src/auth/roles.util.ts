import type { UserRole } from "../database/schemas/user.schema";

/**
 * Роль для API/JWT. Поле `role` в таблице users (PostgreSQL).
 */
export function inferUserRole(user: { role: string; login: string }): UserRole {
  if (user.role === "admin") return "admin";
  if (user.role === "manager") return "manager";
  if (user.login === "admin") return "admin";
  return "editor";
}

export function hasLandingsFullAccess(role: string): boolean {
  return role === "admin" || role === "manager";
}
