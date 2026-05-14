import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import { AuthService } from "./auth.service";
export declare class AuthController {
    private readonly auth;
    private readonly config;
    constructor(auth: AuthService, config: ConfigService);
    authInfo(accept: string | undefined, res: Response): void;
    login(body: {
        login?: string;
        password?: string;
    }): Promise<{
        token: string;
        user: {
            id: number;
            login: string;
            role: string;
        };
    }>;
}
