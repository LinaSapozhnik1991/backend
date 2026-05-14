"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfraModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const config_1 = require("@nestjs/config");
const crm_queue_processor_1 = require("./crm-queue.processor");
const crm_queue_service_1 = require("./crm-queue.service");
const infra_controller_1 = require("./infra.controller");
let InfraModule = class InfraModule {
};
exports.InfraModule = InfraModule;
exports.InfraModule = InfraModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (cfg) => {
                    const password = cfg.get("REDIS_PASSWORD");
                    return {
                        connection: {
                            host: cfg.get("REDIS_HOST", "127.0.0.1"),
                            port: +(cfg.get("REDIS_PORT", "6379") ?? "6379"),
                            ...(password ? { password } : {})
                        }
                    };
                }
            }),
            bullmq_1.BullModule.registerQueue({ name: crm_queue_service_1.CRM_QUEUE })
        ],
        controllers: [infra_controller_1.InfraController],
        providers: [crm_queue_service_1.CrmQueueService, crm_queue_processor_1.CrmQueueProcessor],
        exports: [crm_queue_service_1.CrmQueueService]
    })
], InfraModule);
//# sourceMappingURL=infra.module.js.map