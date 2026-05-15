import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { KeitaroService } from "./keitaro.service";

/** SYNC_CRON=off|false|disabled|none — без периодического cron (ручной POST /api/sync/keitaro). */
function isSyncCronDisabled(raw: string | undefined): boolean {
  const v = (raw ?? "").trim().toLowerCase();
  return v === "off" || v === "false" || v === "0" || v === "disabled" || v === "none";
}

function isEnvFlagFalse(raw: string | undefined): boolean {
  const v = (raw ?? "").trim().toLowerCase();
  return v === "false" || v === "0" || v === "off" || v === "no";
}

/**
 * Синхронизация лендингов и офферов Keitaro: опционально при старте и по SYNC_CRON.
 * По умолчанию cron каждые 15 минут; SYNC_CRON=off отключает только расписание.
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
    if (isSyncCronDisabled(raw)) {
      this.log.log("Keitaro: периодический cron отключён (SYNC_CRON=off)");
    } else {
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
    }

    const syncOnStart = this.cfg.get<string>("KEITARO_SYNC_ON_START", "true");
    if (isEnvFlagFalse(syncOnStart)) {
      this.log.log("Keitaro: синхронизация при старте отключена (KEITARO_SYNC_ON_START=false)");
      return;
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
