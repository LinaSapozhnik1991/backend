import { WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from "../database/prisma.service";
import { type PingJobPayload } from "./crm-queue.service";
export declare class CrmQueueProcessor extends WorkerHost {
    private readonly prisma;
    private readonly log;
    constructor(prisma: PrismaService);
    process(job: Job<PingJobPayload>): Promise<void>;
}
