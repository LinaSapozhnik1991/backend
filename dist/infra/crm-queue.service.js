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
exports.CrmQueueService = exports.CRM_QUEUE = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
exports.CRM_QUEUE = "crm";
let CrmQueueService = class CrmQueueService {
    constructor(crmQueue) {
        this.crmQueue = crmQueue;
    }
    async enqueuePing(note) {
        const job = await this.crmQueue.add("ping", { note: note ?? "" }, { removeOnComplete: 500, removeOnFail: 200 });
        return { jobId: job.id };
    }
};
exports.CrmQueueService = CrmQueueService;
exports.CrmQueueService = CrmQueueService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)(exports.CRM_QUEUE)),
    __metadata("design:paramtypes", [bullmq_2.Queue])
], CrmQueueService);
//# sourceMappingURL=crm-queue.service.js.map