import { Queue } from "bullmq";
export declare const CRM_QUEUE = "crm";
export type PingJobPayload = {
    note?: string;
};
export declare class CrmQueueService {
    private readonly crmQueue;
    constructor(crmQueue: Queue);
    enqueuePing(note?: string): Promise<{
        jobId: string | undefined;
    }>;
}
