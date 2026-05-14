"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KeitaroCronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeitaroCronService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const cron_1 = require("cron");
const keitaro_service_1 = require("./keitaro.service");
let KeitaroCronService = KeitaroCronService_1 = class KeitaroCronService {
    constructor(scheduler, cfg, keitaro) {
        this.scheduler = scheduler;
        this.cfg = cfg;
        this.keitaro = keitaro;
        this.log = new common_1.Logger(KeitaroCronService_1.name);
    }
    onModuleInit() {
        const raw = this.cfg.get("SYNC_CRON", "*/15 * * * *")?.trim();
        const expr = raw && raw.length > 0 ? raw : "*/15 * * * *";
        try {
            const job = new cron_1.CronJob(expr, () => {
                void this.runSafe();
            });
            this.scheduler.addCronJob("keitaro-sync", job);
            job.start();
            this.log.log(`Keitaro: cron зарегистрирован (${expr})`);
        }
        catch (e) {
            this.log.error(`Keitaro: некорректный SYNC_CRON="${expr}"`, e);
        }
        void this.runSafe();
    }
    async runSafe() {
        try {
            const r = await this.keitaro.syncLandings();
            this.log.log(`Keitaro: синхронизация — лендинги added=${r.landings.added} updated=${r.landings.updated} skipped=${r.landings.skipped}; офферы added=${r.offers.added} updated=${r.offers.updated} skipped=${r.offers.skipped}`);
            if (r.warnings.length > 0) {
                for (const w of r.warnings.slice(0, 20)) {
                    this.log.warn(w);
                }
                if (r.warnings.length > 20) {
                    this.log.warn(`… ещё предупреждений: ${r.warnings.length - 20}`);
                }
            }
        }
        catch (e) {
            this.log.error("Keitaro: ошибка фоновой синхронизации", e);
        }
    }
};
exports.KeitaroCronService = KeitaroCronService;
exports.KeitaroCronService = KeitaroCronService = KeitaroCronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [schedule_1.SchedulerRegistry,
        config_1.ConfigService,
        keitaro_service_1.KeitaroService])
], KeitaroCronService);
//# sourceMappingURL=keitaro.cron.js.map