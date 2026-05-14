import { Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { AuthGuard } from "../auth/auth.guard";
import type { SyncResultDto } from "./dto/sync-result.dto";
import { KeitaroService } from "./keitaro.service";

/** POST /api/sync/keitaro (admin) — лендинги + офферы из Keitaro, как фоновая синхронизация по cron. */
@Controller("sync")
@UseGuards(AuthGuard, AdminGuard)
export class KeitaroController {
  constructor(private readonly keitaro: KeitaroService) {}

  @Post("keitaro")
  @HttpCode(200)
  async runSync(): Promise<SyncResultDto> {
    return this.keitaro.syncLandings();
  }
}
