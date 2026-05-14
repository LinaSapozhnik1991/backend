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
exports.HistoryController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../auth/auth.guard");
const current_user_decorator_1 = require("../common/current-user.decorator");
const prisma_service_1 = require("../database/prisma.service");
const landings_service_1 = require("../landings/landings.service");
let HistoryController = class HistoryController {
    constructor(prisma, landingsService) {
        this.prisma = prisma;
        this.landingsService = landingsService;
    }
    async list(user, landingId) {
        const lid = +landingId;
        if (lid <= 0)
            throw new common_1.UnprocessableEntityException({ error: "landing_id обязателен" });
        const row = await this.prisma.landing.findUnique({ where: { id: lid } });
        if (!row)
            throw new common_1.NotFoundException({ error: "Запись не найдена" });
        this.landingsService.assertOfferLandingAccess(user, row.recordType);
        const rows = await this.prisma.historyEntry.findMany({
            where: { landingId: lid },
            orderBy: { id: "desc" }
        });
        const userIds = [...new Set(rows.map((h) => h.userId))];
        const userRows = await this.prisma.user.findMany({
            where: { id: { in: userIds } }
        });
        const loginById = new Map(userRows.map((u) => [u.id, u.login]));
        return rows.map((h) => ({
            id: h.id,
            landing_id: h.landingId,
            action: h.action,
            entity_type: h.entityType,
            entity_key: h.entityKey,
            old_value: h.oldValue,
            new_value: h.newValue,
            created_at: h.createdAt,
            user_login: loginById.get(h.userId) ?? ""
        }));
    }
};
exports.HistoryController = HistoryController;
__decorate([
    (0, common_1.Get)(":landingId"),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("landingId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HistoryController.prototype, "list", null);
exports.HistoryController = HistoryController = __decorate([
    (0, common_1.Controller)("history"),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        landings_service_1.LandingsService])
], HistoryController);
//# sourceMappingURL=history.controller.js.map