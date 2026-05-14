import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../database/prisma.service";
export declare class AuthService {
    private readonly prisma;
    private readonly config;
    constructor(prisma: PrismaService, config: ConfigService);
    login(login: string, password: string): Promise<{
        token: string;
        user: {
            id: number;
            login: string;
            role: string;
        };
    }>;
}
