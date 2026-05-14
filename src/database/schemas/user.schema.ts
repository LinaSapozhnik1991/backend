/**
 * Тип пользователя для API (совместим с Prisma-моделью User).
 */
export type UserRole = "admin" | "editor" | "manager";

export interface UserDoc {
  id: number;
  login: string;
  passwordHash: string;
  role: UserRole;
}
