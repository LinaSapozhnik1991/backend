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
exports.LandingsService = void 0;
const common_1 = require("@nestjs/common");
const roles_util_1 = require("../auth/roles.util");
const catalog_service_1 = require("../catalog/catalog.service");
const counter_service_1 = require("../database/counter.service");
const prisma_service_1 = require("../database/prisma.service");
function metricToNumber(v) {
    if (v == null)
        return null;
    if (typeof v === "number" && Number.isFinite(v))
        return v;
    if (typeof v === "object" &&
        v !== null &&
        "toNumber" in v &&
        typeof v.toNumber === "function") {
        return v.toNumber();
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}
let LandingsService = class LandingsService {
    constructor(prisma, catalog, counter) {
        this.prisma = prisma;
        this.catalog = catalog;
        this.counter = counter;
    }
    assertOfferLandingAccess(user, recordType) {
        if ((0, roles_util_1.hasLandingsFullAccess)(user.role))
            return;
        if (recordType !== "offer") {
            throw new common_1.ForbiddenException({
                error: "Доступ только к офферам. Лендинги доступны администратору и менеджеру."
            });
        }
    }
    assertRecordMatchesScope(scope, recordType) {
        const rt = recordType === "landing" ? "landing" : "offer";
        if (scope === "landing" && rt !== "landing") {
            throw new common_1.NotFoundException({ error: "Запись не найдена" });
        }
        if (scope === "offer" && rt !== "offer") {
            throw new common_1.NotFoundException({ error: "Запись не найдена" });
        }
    }
    async list(scope, user) {
        if (scope === "landing") {
            if (!(0, roles_util_1.hasLandingsFullAccess)(user.role)) {
                throw new common_1.ForbiddenException({ error: "Нет доступа к списку лендингов" });
            }
            const rows = await this.prisma.landing.findMany({
                where: { recordType: "landing" },
                orderBy: { id: "desc" }
            });
            return rows.map((r) => this.serializeLandingRow(r));
        }
        const rows = await this.prisma.landing.findMany({
            where: { recordType: "offer" },
            orderBy: { id: "desc" }
        });
        return rows.map((r) => this.serializeLandingRow(r));
    }
    serializeLandingRow(l) {
        const rawRt = String(l.recordType ?? "").trim().toLowerCase();
        const record_type = rawRt === "landing" ? "landing" : "offer";
        return {
            id: l.id,
            name: l.name,
            group_name: l.groupName,
            record_type,
            status: l.status,
            roi: metricToNumber(l.roi),
            conversion: metricToNumber(l.conversion),
            cr: metricToNumber(l.cr),
            crc: metricToNumber(l.crc),
            created_at: l.createdAt,
            updated_at: l.updatedAt,
            keitaro_id: l.keitaroId ?? null,
            group_id: l.groupId ?? null,
            state: l.state ?? null,
            local_path: l.localPath ?? null,
            preview_path: l.previewPath ?? null,
            landing_type: l.landingType ?? null
        };
    }
    async getDetails(landingId) {
        const landing = await this.prisma.landing.findUnique({ where: { id: landingId } });
        if (!landing) {
            throw new common_1.NotFoundException({ error: "Лендинг не найден" });
        }
        const [widgetsOut, scriptsOut, setRows] = await Promise.all([
            this.catalog.mergedWidgetsForLanding(landingId),
            this.catalog.mergedScriptsForLanding(landingId),
            this.prisma.settingRow.findMany({
                where: { landingId },
                orderBy: { id: "asc" }
            })
        ]);
        return {
            landing: this.serializeLandingRow(landing),
            widgets: widgetsOut,
            scripts: scriptsOut,
            settings: setRows.map((s) => ({
                key: s.settingKey,
                value: s.settingValue ?? ""
            }))
        };
    }
    async getOne(scope, user, id) {
        const details = await this.getDetails(id);
        const landing = details.landing;
        const rt = String(landing.record_type ?? "offer");
        this.assertRecordMatchesScope(scope, rt);
        this.assertOfferLandingAccess(user, rt);
        return details;
    }
    async create(scope, user, body) {
        const payload = { ...body };
        if (scope === "landing") {
            if (!(0, roles_util_1.hasLandingsFullAccess)(user.role)) {
                throw new common_1.ForbiddenException({
                    error: "Создавать записи типа «лендинг» может только пользователь с полным доступом к лендингам."
                });
            }
            payload.record_type = "landing";
        }
        else {
            if (!(0, roles_util_1.hasLandingsFullAccess)(user.role)) {
                if ((payload.record_type ?? "offer") === "landing") {
                    throw new common_1.ForbiddenException({ error: "Создавать записи типа «лендинг» может только администратор." });
                }
                payload.record_type = "offer";
            }
            else {
                payload.record_type = "offer";
            }
        }
        const id = await this.createLandingEntity(payload);
        await this.addHistoryRow(id, user.id, "create", "landing", "name", null, String(payload.name ?? "Новый лендинг"));
        return this.getDetails(id);
    }
    async clone(scope, user, cloneId) {
        const source = await this.getDetails(cloneId);
        const srcLanding = source.landing;
        const rt = String(srcLanding.record_type ?? "offer");
        this.assertRecordMatchesScope(scope, rt);
        this.assertOfferLandingAccess(user, rt);
        const recordType = rt === "landing" ? "landing" : "offer";
        const payload = {
            name: String(srcLanding.name ?? "") + " (копия)",
            group_name: String(srcLanding.group_name ?? "default"),
            record_type: recordType,
            status: "inactive",
            widgets: source.widgets ?? [],
            scripts: source.scripts ?? [],
            settings: source.settings ?? []
        };
        const newId = await this.createLandingEntity(payload);
        await this.addHistoryRow(newId, user.id, "create", "landing", "clone", null, `Скопирован с ID ${cloneId}`);
        return this.getDetails(newId);
    }
    async update(scope, user, id, body) {
        const before = await this.getDetails(id);
        const bLanding = before.landing;
        const rt = String(bLanding.record_type ?? "offer");
        this.assertRecordMatchesScope(scope, rt);
        this.assertOfferLandingAccess(user, rt);
        const payload = { ...body };
        if (scope === "landing") {
            if (!(0, roles_util_1.hasLandingsFullAccess)(user.role)) {
                throw new common_1.ForbiddenException({ error: "Нет доступа к редактированию лендингов" });
            }
            payload.record_type = "landing";
        }
        else {
            payload.record_type = "offer";
        }
        await this.updateLandingEntity(id, payload, user.id, before);
        return this.getDetails(id);
    }
    async remove(scope, user, id) {
        const beforeDelete = await this.getDetails(id);
        const l = beforeDelete.landing;
        const rt = String(l.record_type ?? "offer");
        this.assertRecordMatchesScope(scope, rt);
        this.assertOfferLandingAccess(user, rt);
        await this.addHistoryRow(id, user.id, "delete", "landing", "landing", JSON.stringify(beforeDelete), null);
        await this.prisma.widgetRow.deleteMany({ where: { landingId: id } });
        await this.prisma.scriptRow.deleteMany({ where: { landingId: id } });
        await this.prisma.settingRow.deleteMany({ where: { landingId: id } });
        await this.prisma.historyEntry.deleteMany({ where: { landingId: id } });
        await this.prisma.landing.delete({ where: { id } });
        return { success: true };
    }
    async createLandingEntity(payload) {
        const name = String(payload.name ?? "Новый лендинг").trim();
        const groupName = String(payload.group_name ?? "default").trim();
        const status = (payload.status ?? "inactive") === "active" ? "active" : "inactive";
        const recordType = (payload.record_type ?? "offer") === "landing" ? "landing" : "offer";
        const now = new Date();
        const landing = await this.prisma.landing.create({
            data: {
                name,
                groupName,
                recordType,
                status,
                roi: null,
                conversion: null,
                cr: null,
                crc: null,
                createdAt: now,
                updatedAt: now
            }
        });
        const id = landing.id;
        await this.syncWidgets(id, payload.widgets ?? []);
        await this.syncScripts(id, payload.scripts ?? []);
        await this.syncSettings(id, payload.settings ?? []);
        return id;
    }
    async updateLandingEntity(landingId, payload, userId, before) {
        const bLanding = before.landing;
        const name = String(payload.name ?? bLanding.name ?? "").trim();
        const groupName = String(payload.group_name ?? bLanding.group_name ?? "default").trim();
        const status = (payload.status ?? bLanding.status) === "active" ? "active" : "inactive";
        const recordType = (payload.record_type ?? bLanding.record_type ?? "offer") === "landing" ? "landing" : "offer";
        await this.prisma.landing.update({
            where: { id: landingId },
            data: { name, groupName, recordType, status }
        });
        await this.syncWidgets(landingId, payload.widgets ?? []);
        await this.syncScripts(landingId, payload.scripts ?? []);
        await this.syncSettings(landingId, payload.settings ?? []);
        const after = await this.getDetails(landingId);
        await this.createDiffHistory(landingId, userId, before, after);
    }
    async syncWidgets(landingId, list) {
        const catalogRows = await this.prisma.widgetCatalog.findMany({
            orderBy: [{ sortOrder: "asc" }, { widgetKey: "asc" }]
        });
        const byKey = new Map(list.map((w) => [String(w.key ?? ""), w]));
        await this.prisma.widgetRow.deleteMany({ where: { landingId } });
        for (let i = 0; i < catalogRows.length; i++) {
            const c = catalogRows[i];
            const from = byKey.get(c.widgetKey);
            const wid = await this.counter.next("widget_rows");
            await this.prisma.widgetRow.create({
                data: {
                    id: wid,
                    landingId,
                    widgetKey: c.widgetKey,
                    widgetName: c.widgetName,
                    isEnabled: Boolean(from?.is_enabled),
                    sortOrder: i + 1
                }
            });
        }
    }
    async syncScripts(landingId, list) {
        const catalogRows = await this.prisma.scriptCatalog.findMany({
            orderBy: [{ sortOrder: "asc" }, { scriptKey: "asc" }]
        });
        const byKey = new Map(list.map((s) => [String(s.key ?? ""), s]));
        await this.prisma.scriptRow.deleteMany({ where: { landingId } });
        for (let i = 0; i < catalogRows.length; i++) {
            const c = catalogRows[i];
            const from = byKey.get(c.scriptKey);
            const sid = await this.counter.next("script_rows");
            await this.prisma.scriptRow.create({
                data: {
                    id: sid,
                    landingId,
                    scriptKey: c.scriptKey,
                    scriptName: c.scriptName,
                    isEnabled: Boolean(from?.is_enabled),
                    sortOrder: i + 1
                }
            });
        }
    }
    async syncSettings(landingId, list) {
        await this.prisma.settingRow.deleteMany({ where: { landingId } });
        for (const s of list) {
            const sid = await this.counter.next("settings");
            await this.prisma.settingRow.create({
                data: {
                    id: sid,
                    landingId,
                    settingKey: String(s.key ?? ""),
                    settingValue: String(s.value ?? "")
                }
            });
        }
    }
    async addHistoryRow(landingId, userId, action, entityType, entityKey, oldValue, newValue) {
        const hid = await this.counter.next("history");
        await this.prisma.historyEntry.create({
            data: {
                id: hid,
                landingId,
                userId,
                action,
                entityType,
                entityKey,
                oldValue,
                newValue
            }
        });
    }
    async createDiffHistory(landingId, userId, before, after) {
        const bL = before.landing;
        const aL = after.landing;
        if (bL.name !== aL.name) {
            await this.addHistoryRow(landingId, userId, "update", "landing", "name", String(bL.name), String(aL.name));
        }
        if (bL.group_name !== aL.group_name) {
            await this.addHistoryRow(landingId, userId, "update", "landing", "group_name", String(bL.group_name), String(aL.group_name));
        }
        if (bL.status !== aL.status) {
            await this.addHistoryRow(landingId, userId, "update", "landing", "status", String(bL.status), String(aL.status));
        }
        if (String(bL.record_type ?? "offer") !== String(aL.record_type ?? "offer")) {
            await this.addHistoryRow(landingId, userId, "update", "landing", "record_type", String(bL.record_type ?? "offer"), String(aL.record_type ?? "offer"));
        }
        await this.diffToggleList(landingId, userId, before.widgets, after.widgets, "widget");
        await this.diffToggleList(landingId, userId, before.scripts, after.scripts, "script");
        await this.diffSettings(landingId, userId, before.settings, after.settings);
    }
    async diffToggleList(landingId, userId, before, after, entityType) {
        const beforeMap = new Map();
        for (const item of before || []) {
            beforeMap.set(String(item.key), item);
        }
        for (const item of after || []) {
            const key = String(item.key);
            const oldEn = beforeMap.get(key)?.is_enabled;
            const neu = item.is_enabled;
            const oldN = oldEn === undefined || oldEn === null ? 0 : oldEn ? 1 : 0;
            const newN = neu ? 1 : 0;
            if (oldN !== newN) {
                await this.addHistoryRow(landingId, userId, newN === 1 ? "enable" : "disable", entityType, key, oldEn === undefined || oldEn === null ? null : oldEn ? "on" : "off", newN === 1 ? "on" : "off");
            }
        }
    }
    async diffSettings(landingId, userId, before, after) {
        const beforeMap = {};
        for (const item of before || []) {
            beforeMap[String(item.key)] = String(item.value ?? "");
        }
        for (const item of after || []) {
            const key = String(item.key);
            const old = beforeMap[key] ?? "";
            const neu = String(item.value ?? "");
            if (old !== neu) {
                await this.addHistoryRow(landingId, userId, "update", "setting", key, old, neu);
            }
        }
    }
};
exports.LandingsService = LandingsService;
exports.LandingsService = LandingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        catalog_service_1.CatalogService,
        counter_service_1.CounterService])
], LandingsService);
//# sourceMappingURL=landings.service.js.map