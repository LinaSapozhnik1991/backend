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
var CrmQueueProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmQueueProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const crm_queue_service_1 = require("./crm-queue.service");
let CrmQueueProcessor = CrmQueueProcessor_1 = class CrmQueueProcessor extends bullmq_1.WorkerHost {
    constructor(prisma) {
        super();
        this.prisma = prisma;
        this.log = new common_1.Logger(CrmQueueProcessor_1.name);
    }
    async process(job) {
        if (job.name !== "ping") {
            this.log.warn(`ignored job name=${job.name}`);
            return;
        }
        const note = job.data?.note;
        await this.prisma.queueSmokeLog.create({
            data: {
                jobId: String(job.id ?? ""),
                note: note && note.length > 0 ? note : undefined
            }
        });
        this.log.debug(`ping jobId=${job.id} persisted to postgres`);
    }
};
exports.CrmQueueProcessor = CrmQueueProcessor;
exports.CrmQueueProcessor = CrmQueueProcessor = CrmQueueProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(crm_queue_service_1.CRM_QUEUE),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CrmQueueProcessor);
//# sourceMappingURL=crm-queue.processor.js.map