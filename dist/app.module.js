"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const path = __importStar(require("path"));
const auth_controller_1 = require("./auth/auth.controller");
const auth_service_1 = require("./auth/auth.service");
const catalog_controller_1 = require("./catalog/catalog.controller");
const catalog_service_1 = require("./catalog/catalog.service");
const filter_presets_controller_1 = require("./filter-presets/filter-presets.controller");
const filter_presets_service_1 = require("./filter-presets/filter-presets.service");
const database_module_1 = require("./database/database.module");
const health_controller_1 = require("./health/health.controller");
const history_controller_1 = require("./history/history.controller");
const infra_module_1 = require("./infra/infra.module");
const keitaro_module_1 = require("./keitaro/keitaro.module");
const landings_controller_1 = require("./landings/landings.controller");
const landings_service_1 = require("./landings/landings.service");
const offers_controller_1 = require("./landings/offers.controller");
const profile_controller_1 = require("./profile/profile.controller");
const public_controller_1 = require("./public/public.controller");
const templates_controller_1 = require("./templates/templates.controller");
const users_controller_1 = require("./users/users.controller");
const users_service_1 = require("./users/users.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [path.join(__dirname, "..", ".env")]
            }),
            database_module_1.DatabaseModule,
            schedule_1.ScheduleModule.forRoot(),
            infra_module_1.InfraModule,
            keitaro_module_1.KeitaroModule
        ],
        controllers: [
            health_controller_1.HealthController,
            auth_controller_1.AuthController,
            profile_controller_1.ProfileController,
            users_controller_1.UsersController,
            landings_controller_1.LandingsController,
            offers_controller_1.OffersController,
            history_controller_1.HistoryController,
            public_controller_1.PublicController,
            templates_controller_1.TemplatesController,
            catalog_controller_1.CatalogController,
            filter_presets_controller_1.FilterPresetsController
        ],
        providers: [auth_service_1.AuthService, catalog_service_1.CatalogService, filter_presets_service_1.FilterPresetsService, landings_service_1.LandingsService, users_service_1.UsersService]
    })
], AppModule);
//# sourceMappingURL=app.module.js.map