import type { SyncResultDto } from "./dto/sync-result.dto";
import { KeitaroService } from "./keitaro.service";
export declare class KeitaroController {
    private readonly keitaro;
    constructor(keitaro: KeitaroService);
    runSync(): Promise<SyncResultDto>;
}
