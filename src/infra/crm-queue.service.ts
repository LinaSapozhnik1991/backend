import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

export const CRM_QUEUE = "crm";

export type PingJobPayload = { note?: string };

@Injectable()
export class CrmQueueService {
  constructor(@InjectQueue(CRM_QUEUE) private readonly crmQueue: Queue) {}

  async enqueuePing(note?: string): Promise<{ jobId: string | undefined }> {
    const job = await this.crmQueue.add(
      "ping",
      { note: note ?? "" } satisfies PingJobPayload,
      { removeOnComplete: 500, removeOnFail: 200 }
    );
    return { jobId: job.id };
  }
}
