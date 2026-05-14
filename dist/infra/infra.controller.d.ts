import { ConfigService } from "@nestjs/config";
import { CrmQueueService } from "./crm-queue.service";
export declare class InfraController {
    private readonly cfg;
    private readonly crmQueue;
    constructor(cfg: ConfigService, crmQueue: CrmQueueService);
    queueSmoke(token: string | undefined): Promise<{
        ok: true;
        jobId: string | undefined;
    }>;
}
