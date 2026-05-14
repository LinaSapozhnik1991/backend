"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeitaroModule = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const keitaro_http_module_options_1 = require("./keitaro-http.module-options");
const keitaro_controller_1 = require("./keitaro.controller");
const keitaro_cron_1 = require("./keitaro.cron");
const keitaro_service_1 = require("./keitaro.service");
let KeitaroModule = class KeitaroModule {
};
exports.KeitaroModule = KeitaroModule;
exports.KeitaroModule = KeitaroModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule,
            axios_1.HttpModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (cfg) => (0, keitaro_http_module_options_1.createKeitaroHttpModuleOptions)(cfg)
            })
        ],
        controllers: [keitaro_controller_1.KeitaroController],
        providers: [keitaro_service_1.KeitaroService, keitaro_cron_1.KeitaroCronService],
        exports: [keitaro_service_1.KeitaroService]
    })
], KeitaroModule);
//# sourceMappingURL=keitaro.module.js.map