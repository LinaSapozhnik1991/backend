import { OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import { KeitaroService } from "./keitaro.service";
export declare class KeitaroCronService implements OnModuleInit {
    private readonly scheduler;
    private readonly cfg;
    private readonly keitaro;
    private readonly log;
    constructor(scheduler: SchedulerRegistry, cfg: ConfigService, keitaro: KeitaroService);
    onModuleInit(): void;
    private runSafe;
}
