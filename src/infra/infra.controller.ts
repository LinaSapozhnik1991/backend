import { Controller, Get, NotFoundException, Query } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CrmQueueService } from "./crm-queue.service";

/**
 * Служебные эндпоинты (smoke-тест Redis+BullMQ+PostgreSQL).
 * Включение: задайте QUEUE_SMOKE_TOKEN в .env и вызывайте с тем же token в query.
 */
@Controller("system")
export class InfraController {
  constructor(
    private readonly cfg: ConfigService,
    private readonly crmQueue: CrmQueueService
  ) {}

  @Get("queue-smoke")
  async queueSmoke(@Query("token") token: string | undefined): Promise<{ ok: true; jobId: string | undefined }> {
    const expected = this.cfg.get<string>("QUEUE_SMOKE_TOKEN");
    if (!expected || token !== expected) {
      throw new NotFoundException();
    }
    const { jobId } = await this.crmQueue.enqueuePing("queue-smoke");
    return { ok: true, jobId };
  }
}
