import { ConfigService } from "@nestjs/config";
import type { JwtUser } from "../auth/jwt.util";
import { UsersService } from "./users.service";
export declare class UsersController {
    private readonly users;
    private readonly config;
    constructor(users: UsersService, config: ConfigService);
    list(): Promise<Record<string, unknown>[]>;
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
    getOne(id: string): Promise<Record<string, unknown>>;
    updateRole(id: string, body: {
        role?: string;
    }, actor: JwtUser): Promise<{
        user: {
            id: number;
            login: string;
            role: string;
        };
        token?: string;
    }>;
    remove(id: string, actor: JwtUser): Promise<{
        ok: boolean;
    }>;
}
