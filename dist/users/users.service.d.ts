import type { JwtUser } from "../auth/jwt.util";
import { CounterService } from "../database/counter.service";
import { PrismaService } from "../database/prisma.service";
export declare class UsersService {
    private readonly prisma;
    private readonly counter;
    constructor(prisma: PrismaService, counter: CounterService);
    list(): Promise<Record<string, unknown>[]>;
    getOne(id: number): Promise<Record<string, unknown>>;
    create(body: {
        login?: string;
        password?: string;
        role?: string;
    }): Promise<{
        user: {
            id: number;
            login: string;
            role: string;
        };
        temporary_password?: string;
    }>;
    updateRole(id: number, body: {
        role?: string;
    }, actor: JwtUser, jwtSecret: string): Promise<{
        user: {
            id: number;
            login: string;
            role: string;
        };
        token?: string;
    }>;
    remove(id: number, actor: JwtUser): Promise<{
        ok: boolean;
    }>;
    changePassword(actorId: number, current: string, next: string): Promise<void>;
}
