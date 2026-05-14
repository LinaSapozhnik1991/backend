import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../database/prisma.service";
import { CRM_QUEUE, type PingJobPayload } from "./crm-queue.service";

@Processor(CRM_QUEUE)
export class CrmQueueProcessor extends WorkerHost {
  private readonly log = new Logger(CrmQueueProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<PingJobPayload>): Promise<void> {
    if (job.name !== "ping") {
      this.log.warn(`ignored job name=${job.name}`);
      return;
    }
    const note = job.data?.note;
    await this.prisma.queueSmokeLog.create({
      data: {
        jobId: String(job.id ?? ""),
        note: note && note.length > 0 ? note : undefined
      }
    });
    this.log.debug(`ping jobId=${job.id} persisted to postgres`);
  }
}
