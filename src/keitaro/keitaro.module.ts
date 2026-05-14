import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { createKeitaroHttpModuleOptions } from "./keitaro-http.module-options";
import { KeitaroController } from "./keitaro.controller";
import { KeitaroCronService } from "./keitaro.cron";
import { KeitaroService } from "./keitaro.service";

@Module({
  imports: [
    ScheduleModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => createKeitaroHttpModuleOptions(cfg)
    })
  ],
  controllers: [KeitaroController],
  providers: [KeitaroService, KeitaroCronService],
  exports: [KeitaroService]
})
export class KeitaroModule {}
