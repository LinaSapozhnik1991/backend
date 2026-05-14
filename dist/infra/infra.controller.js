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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfraController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crm_queue_service_1 = require("./crm-queue.service");
let InfraController = class InfraController {
    constructor(cfg, crmQueue) {
        this.cfg = cfg;
        this.crmQueue = crmQueue;
    }
    async queueSmoke(token) {
        const expected = this.cfg.get("QUEUE_SMOKE_TOKEN");
        if (!expected || token !== expected) {
            throw new common_1.NotFoundException();
        }
        const { jobId } = await this.crmQueue.enqueuePing("queue-smoke");
        return { ok: true, jobId };
    }
};
exports.InfraController = InfraController;
__decorate([
    (0, common_1.Get)("queue-smoke"),
    __param(0, (0, common_1.Query)("token")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], InfraController.prototype, "queueSmoke", null);
exports.InfraController = InfraController = __decorate([
    (0, common_1.Controller)("system"),
    __metadata("design:paramtypes", [config_1.ConfigService,
        crm_queue_service_1.CrmQueueService])
], InfraController);
//# sourceMappingURL=infra.controller.js.map