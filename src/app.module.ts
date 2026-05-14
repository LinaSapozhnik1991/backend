import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import * as path from "path";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { CatalogController } from "./catalog/catalog.controller";
import { CatalogService } from "./catalog/catalog.service";
import { FilterPresetsController } from "./filter-presets/filter-presets.controller";
import { FilterPresetsService } from "./filter-presets/filter-presets.service";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health/health.controller";
import { HistoryController } from "./history/history.controller";
import { InfraModule } from "./infra/infra.module";
import { KeitaroModule } from "./keitaro/keitaro.module";
import { LandingsController } from "./landings/landings.controller";
import { LandingsService } from "./landings/landings.service";
import { OffersController } from "./landings/offers.controller";
import { ProfileController } from "./profile/profile.controller";
import { PublicController } from "./public/public.controller";
import { TemplatesController } from "./templates/templates.controller";
import { UsersController } from "./users/users.controller";
import { UsersService } from "./users/users.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.join(__dirname, "..", ".env")]
    }),
    DatabaseModule,
    ScheduleModule.forRoot(),
    InfraModule,
    KeitaroModule
  ],
  controllers: [
    HealthController,
    AuthController,
    ProfileController,
    UsersController,
    LandingsController,
    OffersController,
    HistoryController,
    PublicController,
    TemplatesController,
    CatalogController,
    FilterPresetsController
  ],
  providers: [AuthService, CatalogService, FilterPresetsService, LandingsService, UsersService]
})
export class AppModule {}
