import type { SyncResultDto } from "./dto/sync-result.dto";
import { KeitaroService } from "./keitaro.service";
import { PrismaService } from "../database/prisma.service";
export declare class KeitaroController {
    private readonly keitaro;
    private readonly prisma;
    constructor(keitaro: KeitaroService, prisma: PrismaService);
    runSync(): Promise<SyncResultDto>;
    setupDatabase(): Promise<{
        message: string;
    }>;
}
