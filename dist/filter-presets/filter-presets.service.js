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
exports.FilterPresetsService = void 0;
const common_1 = require("@nestjs/common");
const counter_service_1 = require("../database/counter.service");
const prisma_service_1 = require("../database/prisma.service");
const filter_presets_constants_1 = require("./filter-presets.constants");
const MAX_PRESETS_PER_CONTEXT = 40;
let FilterPresetsService = class FilterPresetsService {
    constructor(prisma, counters) {
        this.prisma = prisma;
        this.counters = counters;
    }
    assertContext(context) {
        if (!(0, filter_presets_constants_1.isAllowedFilterPresetContext)(context)) {
            throw new common_1.BadRequestException({ error: "Недопустимый контекст фильтра" });
        }
    }
    async list(context) {
        const ctx = String(context ?? "").trim();
        this.assertContext(ctx);
        const rows = await this.prisma.filterPreset.findMany({
            where: {
                OR: [{ context: ctx }, { context: filter_presets_constants_1.FILTER_PRESET_GLOBAL_CONTEXT, savedFromContext: ctx }]
            },
            orderBy: { createdAt: "desc" },
            take: 200
        });
        return rows.map((row) => {
            const rulesRaw = row.rules;
            const rules = Array.isArray(rulesRaw)
                ? rulesRaw.map((r) => {
                    const o = r;
                    return {
                        field: String(o.field ?? "name"),
                        op: String(o.op ?? "contains"),
                        value: String(o.value ?? "")
                    };
                })
                : [];
            const storedContext = row.context;
            const savedFrom = row.savedFromContext && row.savedFromContext.trim() !== ""
                ? row.savedFromContext
                : storedContext !== filter_presets_constants_1.FILTER_PRESET_GLOBAL_CONTEXT
                    ? storedContext
                    : undefined;
            const out = {
                id: row.id,
                name: row.name,
                rules,
                created_at: row.createdAt.toISOString()
            };
            if (savedFrom) {
                out.saved_from_context = savedFrom;
            }
            return out;
        });
    }
    async create(body) {
        const scope = String(body.context ?? "").trim();
        if (!(0, filter_presets_constants_1.isAllowedFilterPresetContext)(scope)) {
            throw new common_1.BadRequestException({ error: "Недопустимый контекст фильтра" });
        }
        const cleaned = body.rules.map((r) => ({
            field: r.field,
            op: r.op,
            value: r.value.trim()
        }));
        if (cleaned.length === 0) {
            throw new common_1.BadRequestException({ error: "Добавьте хотя бы одно условие с непустым значением" });
        }
        const storeContext = filter_presets_constants_1.FILTER_PRESET_GLOBAL_CONTEXT;
        const n = await this.prisma.filterPreset.count({ where: { context: storeContext } });
        if (n >= MAX_PRESETS_PER_CONTEXT) {
            throw new common_1.BadRequestException({
                error: `Не больше ${MAX_PRESETS_PER_CONTEXT} общих шаблонов (создайте место, удалив старые)`
            });
        }
        const id = await this.counters.next("filter_preset");
        const row = await this.prisma.filterPreset.create({
            data: {
                id,
                context: storeContext,
                name: body.name.trim(),
                rules: cleaned,
                savedFromContext: scope
            }
        });
        return {
            id: row.id,
            name: row.name,
            rules: row.rules,
            created_at: row.createdAt.toISOString(),
            saved_from_context: scope
        };
    }
    async delete(presetId) {
        const res = await this.prisma.filterPreset.deleteMany({ where: { id: presetId } });
        if (res.count === 0) {
            throw new common_1.NotFoundException({ error: "Шаблон не найден" });
        }
    }
};
exports.FilterPresetsService = FilterPresetsService;
exports.FilterPresetsService = FilterPresetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        counter_service_1.CounterService])
], FilterPresetsService);
//# sourceMappingURL=filter-presets.service.js.map