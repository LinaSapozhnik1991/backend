import type { JwtUser } from "../auth/jwt.util";
import { PrismaService } from "../database/prisma.service";
import { UsersService } from "../users/users.service";
export declare class ProfileController {
    private readonly prisma;
    private readonly usersService;
    constructor(prisma: PrismaService, usersService: UsersService);
    getProfile(actor: JwtUser): Promise<{
        user: {
            id: number;
            login: string;
            role: import("../database/schemas/user.schema").UserRole;
            created_at: Date | null;
        };
    }>;
    patchPassword(actor: JwtUser, body: {
        current_password?: string;
        new_password?: string;
    }): Promise<{
        ok: boolean;
    }>;
}
