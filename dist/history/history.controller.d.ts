import type { JwtUser } from "../auth/jwt.util";
import { PrismaService } from "../database/prisma.service";
import { LandingsService } from "../landings/landings.service";
export declare class HistoryController {
    private readonly prisma;
    private readonly landingsService;
    constructor(prisma: PrismaService, landingsService: LandingsService);
    list(user: JwtUser, landingId: string): Promise<{
        id: number;
        landing_id: number;
        action: string;
        entity_type: string;
        entity_key: string | null;
        old_value: string | null;
        new_value: string | null;
        created_at: Date;
        user_login: string;
    }[]>;
}
