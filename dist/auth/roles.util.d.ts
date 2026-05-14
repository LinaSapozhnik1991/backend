import type { UserRole } from "../database/schemas/user.schema";
export declare function inferUserRole(user: {
    role: string;
    login: string;
}): UserRole;
export declare function hasLandingsFullAccess(role: string): boolean;
