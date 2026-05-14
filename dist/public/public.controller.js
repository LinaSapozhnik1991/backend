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
exports.PublicController = void 0;
const common_1 = require("@nestjs/common");
const catalog_service_1 = require("../catalog/catalog.service");
const prisma_service_1 = require("../database/prisma.service");
const public_config_cache_1 = require("./public-config-cache");
let PublicController = class PublicController {
    constructor(prisma, catalog) {
        this.prisma = prisma;
        this.catalog = catalog;
    }
    async config(landingIdRaw) {
        const landingId = +(landingIdRaw ?? "0");
        if (landingId <= 0) {
            throw new common_1.UnprocessableEntityException({ error: "landing_id обязателен" });
        }
        const now = Date.now();
        const publicConfigCache = (0, public_config_cache_1.getPublicConfigCache)();
        const hit = publicConfigCache.get(landingId);
        if (hit && hit.expires > now) {
            return hit.payload;
        }
        const landing = await this.prisma.landing.findFirst({
            where: { id: landingId, status: "active" }
        });
        if (!landing) {
            throw new common_1.NotFoundException({ error: "Активный лендинг не найден" });
        }
        const [mergedW, mergedS, setRows] = await Promise.all([
            this.catalog.mergedWidgetsForLanding(landingId),
            this.catalog.mergedScriptsForLanding(landingId),
            this.prisma.settingRow.findMany({
                where: { landingId },
                orderBy: { id: "asc" }
            })
        ]);
        const settings = {};
        for (const s of setRows) {
            settings[s.settingKey] = s.settingValue ?? "";
        }
        const payload = {
            landing: {
                id: landing.id,
                name: landing.name,
                status: landing.status,
                created_at: landing.createdAt,
                updated_at: landing.updatedAt
            },
            widgets: mergedW.map((w) => ({
                widget_key: w.key,
                widget_name: w.name,
                is_enabled: w.is_enabled,
                sort_order: w.sort_order
            })),
            scripts: mergedS.map((s) => ({
                script_key: s.key,
                script_name: s.name,
                is_enabled: s.is_enabled,
                sort_order: s.sort_order
            })),
            settings
        };
        publicConfigCache.set(landingId, { expires: now + public_config_cache_1.PUBLIC_CONFIG_TTL_MS, payload });
        return payload;
    }
};
exports.PublicController = PublicController;
__decorate([
    (0, common_1.Get)("config"),
    (0, common_1.Header)("Cache-Control", "public, max-age=60"),
    __param(0, (0, common_1.Query)("landing_id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicController.prototype, "config", null);
exports.PublicController = PublicController = __decorate([
    (0, common_1.Controller)("public"),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        catalog_service_1.CatalogService])
], PublicController);
//# sourceMappingURL=public.controller.js.map