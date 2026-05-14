import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { KeitaroService } from "./keitaro.service";

/**
 * Синхронизация лендингов и офферов Keitaro: при старте API один раз, далее по расписанию.
 * Расписание: SYNC_CRON (cron, 5 полей), по умолчанию каждые 15 минут.
 */
@Injectable()
export class KeitaroCronService implements OnModuleInit {
  private readonly log = new Logger(KeitaroCronService.name);

  constructor(
    private readonly scheduler: SchedulerRegistry,
    private readonly cfg: ConfigService,
    private readonly keitaro: KeitaroService
  ) {}

  onModuleInit(): void {
    const raw = this.cfg.get<string>("SYNC_CRON", "*/15 * * * *")?.trim();
    const expr = raw && raw.length > 0 ? raw : "*/15 * * * *";
    try {
      const job = new CronJob(expr, () => {
        void this.runSafe();
      });
      this.scheduler.addCronJob("keitaro-sync", job);
      job.start();
      this.log.log(`Keitaro: cron зарегистрирован (${expr})`);
    } catch (e) {
      this.log.error(`Keitaro: некорректный SYNC_CRON="${expr}"`, e);
    }
    void this.runSafe();
  }

  private async runSafe(): Promise<void> {
    try {
      const r = await this.keitaro.syncLandings();
      this.log.log(
        `Keitaro: синхронизация — лендинги added=${r.landings.added} updated=${r.landings.updated} skipped=${r.landings.skipped}; офферы added=${r.offers.added} updated=${r.offers.updated} skipped=${r.offers.skipped}`
      );
      if (r.warnings.length > 0) {
        for (const w of r.warnings.slice(0, 20)) {
          this.log.warn(w);
        }
        if (r.warnings.length > 20) {
          this.log.warn(`… ещё предупреждений: ${r.warnings.length - 20}`);
        }
      }
    } catch (e) {
      this.log.error("Keitaro: ошибка фоновой синхронизации", e);
    }
  }
}
