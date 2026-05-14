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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const template_key_util_1 = require("../common/template-key.util");
const public_config_cache_1 = require("../public/public-config-cache");
let CatalogService = class CatalogService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listWidgets() {
        const rows = await this.prisma.widgetCatalog.findMany({
            orderBy: [{ sortOrder: "asc" }, { widgetKey: "asc" }]
        });
        return rows.map((r) => ({ key: r.widgetKey, name: r.widgetName }));
    }
    async listScripts() {
        const rows = await this.prisma.scriptCatalog.findMany({
            orderBy: [{ sortOrder: "asc" }, { scriptKey: "asc" }]
        });
        return rows.map((r) => ({ key: r.scriptKey, name: r.scriptName }));
    }
    async replaceWidgets(items) {
        const normalized = items.map((it) => ({
            key: (0, template_key_util_1.canonicalTemplateKey)(String(it.key ?? "")),
            name: it.name
        }));
        const deduped = this.dedupe(normalized);
        await this.prisma.$transaction(async (tx) => {
            await tx.widgetCatalog.deleteMany({});
            if (deduped.length > 0) {
                await tx.widgetCatalog.createMany({
                    data: deduped.map((d, i) => ({
                        widgetKey: d.key,
                        widgetName: d.name,
                        sortOrder: i + 1
                    }))
                });
            }
            if (deduped.length === 0) {
                await tx.widgetRow.deleteMany({});
            }
            else {
                const keys = deduped.map((x) => x.key);
                await tx.widgetRow.deleteMany({ where: { widgetKey: { notIn: keys } } });
            }
        });
        (0, public_config_cache_1.clearPublicConfigCache)();
        return this.listWidgets();
    }
    async replaceScripts(items) {
        const normalized = items.map((it) => ({
            key: (0, template_key_util_1.canonicalTemplateKey)(String(it.key ?? "")),
            name: it.name
        }));
        const deduped = this.dedupe(normalized);
        await this.prisma.$transaction(async (tx) => {
            await tx.scriptCatalog.deleteMany({});
            if (deduped.length > 0) {
                await tx.scriptCatalog.createMany({
                    data: deduped.map((d, i) => ({
                        scriptKey: d.key,
                        scriptName: d.name,
                        sortOrder: i + 1
                    }))
                });
            }
            if (deduped.length === 0) {
                await tx.scriptRow.deleteMany({});
            }
            else {
                const keys = deduped.map((x) => x.key);
                await tx.scriptRow.deleteMany({ where: { scriptKey: { notIn: keys } } });
            }
        });
        (0, public_config_cache_1.clearPublicConfigCache)();
        return this.listScripts();
    }
    async mergedWidgetsForLanding(landingId) {
        const [cat, rows] = await Promise.all([
            this.prisma.widgetCatalog.findMany({
                orderBy: [{ sortOrder: "asc" }, { widgetKey: "asc" }]
            }),
            this.prisma.widgetRow.findMany({
                where: { landingId },
                orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
            })
        ]);
        const map = new Map(rows.map((r) => [r.widgetKey, r]));
        return cat.map((c, i) => {
            const w = map.get(c.widgetKey);
            return {
                id: w?.id ?? 0,
                key: c.widgetKey,
                name: c.widgetName,
                is_enabled: w ? Boolean(w.isEnabled) : false,
                sort_order: w?.sortOrder ?? i + 1
            };
        });
    }
    async mergedScriptsForLanding(landingId) {
        const [cat, rows] = await Promise.all([
            this.prisma.scriptCatalog.findMany({
                orderBy: [{ sortOrder: "asc" }, { scriptKey: "asc" }]
            }),
            this.prisma.scriptRow.findMany({
                where: { landingId },
                orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
            })
        ]);
        const map = new Map(rows.map((r) => [r.scriptKey, r]));
        return cat.map((c, i) => {
            const s = map.get(c.scriptKey);
            return {
                id: s?.id ?? 0,
                key: c.scriptKey,
                name: c.scriptName,
                is_enabled: s ? Boolean(s.isEnabled) : false,
                sort_order: s?.sortOrder ?? i + 1
            };
        });
    }
    dedupe(items) {
        const map = new Map();
        for (const it of items) {
            const k = String(it.key ?? "").trim();
            const n = String(it.name ?? "").trim();
            if (k === "" || n === "")
                continue;
            map.set(k, n);
        }
        return Array.from(map.entries()).map(([key, name]) => ({ key, name }));
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map