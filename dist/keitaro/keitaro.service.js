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
var KeitaroService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeitaroService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../database/prisma.service");
const keitaro_http_constants_1 = require("./keitaro-http.constants");
const MAX_SYNC_PAGES = 500;
const DEFAULT_PER_PAGE = 100;
let KeitaroService = KeitaroService_1 = class KeitaroService {
    constructor(http, cfg, prisma) {
        this.http = http;
        this.cfg = cfg;
        this.prisma = prisma;
        this.log = new common_1.Logger(KeitaroService_1.name);
    }
    async fetchOffers(warnings) {
        const baseUrl = this.cfg.get("KEITARO_BASE_URL", "").trim();
        const apiKey = this.cfg.get("KEITARO_API_KEY", "").trim();
        if (!baseUrl || !apiKey) {
            const msg = "Keitaro fetchOffers: пропуск — не заданы KEITARO_BASE_URL или KEITARO_API_KEY";
            this.log.warn(msg);
            warnings?.push(msg);
            return [];
        }
        const endpoint = this.cfg.get("KEITARO_OFFERS_ENDPOINT", "/admin_api/v1/offers").trim();
        const perPage = Math.min(Math.max(1, +(this.cfg.get("KEITARO_OFFERS_PER_PAGE") ?? String(DEFAULT_PER_PAGE))), 500);
        const all = [];
        let page = 1;
        while (page <= MAX_SYNC_PAGES) {
            const url = this.buildPagedUrl(baseUrl, endpoint, page, perPage);
            try {
                const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url, {
                    headers: this.buildAuthHeaders(apiKey),
                    validateStatus: (s) => s < 500
                }));
                if (res.status >= 400) {
                    const msg = `Keitaro fetchOffers: HTTP ${res.status} на page=${page}`;
                    this.log.warn(msg);
                    warnings?.push(msg);
                    break;
                }
                const data = this.extractOffersListPayload(res.data, warnings, page);
                if (data == null) {
                    break;
                }
                if (data.length === 0) {
                    break;
                }
                for (const raw of data) {
                    if (raw && typeof raw === "object") {
                        all.push(raw);
                    }
                }
                if (data.length < perPage) {
                    break;
                }
                if (data.length > perPage) {
                    this.log.warn(`Keitaro fetchOffers: page=${page} вернуло ${data.length} элементов при per_page=${perPage} — ответ без пагинации, остановка после одной порции`);
                    break;
                }
                page += 1;
            }
            catch (e) {
                const err = e instanceof Error ? e.message : String(e);
                const msg = `Keitaro fetchOffers: запрос page=${page} — ${err}`;
                this.log.warn(msg);
                warnings?.push(msg);
                if (/socket|tls|ssl|handshake|secure/i.test(err)) {
                    warnings?.push("Keitaro TLS (offers): проверьте HTTP(S)_PROXY у процесса Node, сеть/VPN; при доверенном трекере с проблемным сертификатом — KEITARO_TLS_REJECT_UNAUTHORIZED=false в backend/.env.");
                }
                break;
            }
        }
        if (page > MAX_SYNC_PAGES) {
            const msg = `Keitaro fetchOffers: достигнут лимит страниц (${MAX_SYNC_PAGES})`;
            this.log.warn(msg);
            warnings?.push(msg);
        }
        this.log.log(`Keitaro fetchOffers: загружено офферов=${all.length}`);
        return all;
    }
    async fetchOfferById(keitaroOfferId, warnings) {
        const baseUrl = this.cfg.get("KEITARO_BASE_URL", "").trim();
        const apiKey = this.cfg.get("KEITARO_API_KEY", "").trim();
        if (!baseUrl || !apiKey) {
            const msg = "Keitaro fetchOfferById: пропуск — не заданы KEITARO_BASE_URL или KEITARO_API_KEY";
            this.log.warn(msg);
            warnings?.push(msg);
            return null;
        }
        if (!Number.isFinite(keitaroOfferId) || keitaroOfferId <= 0) {
            return null;
        }
        const url = this.buildOfferByIdUrl(baseUrl, keitaroOfferId);
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url, {
                headers: this.buildAuthHeaders(apiKey),
                validateStatus: (s) => s < 500
            }));
            if (res.status >= 400) {
                const msg = `Keitaro fetchOfferById: HTTP ${res.status} id=${keitaroOfferId}`;
                this.log.warn(msg);
                warnings?.push(msg);
                return null;
            }
            const body = res.data;
            if (body == null || typeof body !== "object" || Array.isArray(body)) {
                const msg = `Keitaro fetchOfferById: неверное тело ответа id=${keitaroOfferId}`;
                this.log.warn(msg);
                warnings?.push(msg);
                return null;
            }
            const offer = body;
            const id = typeof offer.id === "number" && Number.isFinite(offer.id) ? offer.id : Number(offer.id);
            if (!Number.isFinite(id) || id <= 0) {
                warnings?.push(`Keitaro fetchOfferById: в ответе нет валидного id (запрос id=${keitaroOfferId})`);
                return null;
            }
            return offer;
        }
        catch (e) {
            const err = e instanceof Error ? e.message : String(e);
            warnings?.push(`Keitaro fetchOfferById: id=${keitaroOfferId} — ${err}`);
            this.log.warn(`Keitaro fetchOfferById: id=${keitaroOfferId} — ${err}`);
            return null;
        }
    }
    async syncLandings() {
        const z = () => ({ added: 0, updated: 0, skipped: 0 });
        const result = { landings: z(), offers: z(), warnings: [] };
        try {
            await this.executeKeitaroLandingsSync(result);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.log.error(`Keitaro sync (landings): ${msg}`, e instanceof Error ? e.stack : undefined);
            result.warnings.push(`Keitaro (лендинги): сбой синхронизации — ${msg}`);
        }
        try {
            await this.executeKeitaroOffersSync(result);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.log.error(`Keitaro sync (offers): ${msg}`, e instanceof Error ? e.stack : undefined);
            result.warnings.push(`Keitaro (офферы): сбой синхронизации — ${msg}`);
        }
        return result;
    }
    async executeKeitaroLandingsSync(result) {
        const baseUrl = this.cfg.get("KEITARO_BASE_URL", "").trim();
        const apiKey = this.cfg.get("KEITARO_API_KEY", "").trim();
        if (!baseUrl || !apiKey) {
            const msg = "Keitaro: пропуск синхронизации — не заданы KEITARO_BASE_URL или KEITARO_API_KEY";
            this.log.warn(msg);
            result.warnings.push(msg);
            return;
        }
        const endpoint = this.cfg.get("KEITARO_LANDINGS_ENDPOINT", "/admin_api/v1/landing_pages").trim();
        const perPage = Math.min(Math.max(1, +(this.cfg.get("KEITARO_LANDINGS_PER_PAGE") ?? String(DEFAULT_PER_PAGE))), 500);
        const landingGroupNames = await this.fetchKeitaroLandingGroupNames(baseUrl, apiKey, result);
        let page = 1;
        while (page <= MAX_SYNC_PAGES) {
            const url = this.buildPagedUrl(baseUrl, endpoint, page, perPage);
            let items;
            try {
                const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url, {
                    headers: this.buildAuthHeaders(apiKey),
                    validateStatus: (s) => s < 500
                }));
                if (res.status >= 400) {
                    result.warnings.push(`Keitaro: HTTP ${res.status} на page=${page}`);
                    break;
                }
                const data = res.data;
                if (!Array.isArray(data)) {
                    result.warnings.push(`Keitaro: неожиданный ответ (не массив) на page=${page}`);
                    break;
                }
                items = data;
            }
            catch (e) {
                const err = e instanceof Error ? e.message : String(e);
                result.warnings.push(`Keitaro: запрос page=${page} — ${err}`);
                if (/socket|tls|ssl|handshake|secure/i.test(err)) {
                    result.warnings.push("Keitaro TLS: проверьте HTTP(S)_PROXY у процесса Node, сеть/VPN; при доверенном трекере с проблемным сертификатом — KEITARO_TLS_REJECT_UNAUTHORIZED=false в backend/.env.");
                }
                break;
            }
            if (items.length === 0) {
                break;
            }
            for (const raw of items) {
                try {
                    const r = await this.upsertOneLanding(raw, landingGroupNames);
                    if (r === "added")
                        result.landings.added += 1;
                    else if (r === "updated")
                        result.landings.updated += 1;
                    else
                        result.landings.skipped += 1;
                }
                catch (e) {
                    const err = e instanceof Error ? e.message : String(e);
                    result.warnings.push(`Keitaro: элемент пропущен — ${err}`);
                    result.landings.skipped += 1;
                }
            }
            if (items.length > perPage) {
                this.log.warn(`Keitaro: landing_pages page=${page} вернуло ${items.length} элементов при per_page=${perPage} — ответ без пагинации, остановка после одной порции`);
                break;
            }
            page += 1;
        }
        if (page > MAX_SYNC_PAGES) {
            result.warnings.push(`Keitaro: достигнут лимит страниц (${MAX_SYNC_PAGES}), остановка`);
        }
        this.log.log(`Keitaro sync landings: added=${result.landings.added} updated=${result.landings.updated} skipped=${result.landings.skipped} warnings=${result.warnings.length}`);
    }
    async executeKeitaroOffersSync(result) {
        const baseUrl = this.cfg.get("KEITARO_BASE_URL", "").trim();
        const apiKey = this.cfg.get("KEITARO_API_KEY", "").trim();
        if (!baseUrl || !apiKey) {
            const msg = "Keitaro: пропуск синхронизации офферов — не заданы KEITARO_BASE_URL или KEITARO_API_KEY";
            this.log.warn(msg);
            result.warnings.push(msg);
            return;
        }
        const offerGroupNames = await this.fetchKeitaroOfferGroupNames(baseUrl, apiKey, result);
        const offers = await this.fetchOffers(result.warnings);
        for (const raw of offers) {
            try {
                const r = await this.upsertOneOffer(raw, offerGroupNames);
                if (r === "added")
                    result.offers.added += 1;
                else if (r === "updated")
                    result.offers.updated += 1;
                else
                    result.offers.skipped += 1;
            }
            catch (e) {
                const err = e instanceof Error ? e.message : String(e);
                result.warnings.push(`Keitaro (оффер): элемент пропущен — ${err}`);
                result.offers.skipped += 1;
            }
        }
        this.log.log(`Keitaro sync offers: added=${result.offers.added} updated=${result.offers.updated} skipped=${result.offers.skipped}`);
    }
    async fetchKeitaroOfferGroupNames(baseUrl, apiKey, result) {
        const map = new Map();
        const url = this.buildOfferGroupsUrl(baseUrl);
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url, {
                headers: this.buildAuthHeaders(apiKey),
                validateStatus: (s) => s < 500
            }));
            if (res.status >= 400) {
                result.warnings.push(`Keitaro: группы офферов — HTTP ${res.status} (поле группы в CRM останется пустым, если имя неизвестно)`);
                return map;
            }
            const data = res.data;
            if (!Array.isArray(data)) {
                result.warnings.push("Keitaro: группы офферов — не массив в ответе (поле группы в CRM останется пустым, если имя неизвестно)");
                return map;
            }
            for (const row of data) {
                if (!row || typeof row !== "object")
                    continue;
                const g = row;
                const id = typeof g.id === "number" && Number.isFinite(g.id) ? g.id : Number(g.id);
                if (!Number.isFinite(id) || id <= 0)
                    continue;
                const name = String(g.name ?? "").trim();
                if (name.length > 0) {
                    map.set(id, name);
                }
            }
            this.log.log(`Keitaro: загружено имён групп офферов: ${map.size}`);
        }
        catch (e) {
            const err = e instanceof Error ? e.message : String(e);
            result.warnings.push(`Keitaro: не удалось загрузить группы офферов — ${err} (имя группы в CRM будет пустым, если неизвестно)`);
        }
        return map;
    }
    buildOfferGroupsUrl(baseUrl) {
        const raw = this.cfg.get("KEITARO_OFFERS_GROUPS_ENDPOINT", "/admin_api/v1/groups").trim();
        const base = baseUrl.replace(/\/+$/, "");
        let path = raw.startsWith("/") ? raw : `/${raw}`;
        if (!/[?&]type=/.test(path)) {
            path += path.includes("?") ? "&type=offers" : "?type=offers";
        }
        return `${base}${path}`;
    }
    async fetchKeitaroLandingGroupNames(baseUrl, apiKey, result) {
        const map = new Map();
        const url = this.buildLandingsGroupsUrl(baseUrl);
        try {
            const res = await (0, rxjs_1.firstValueFrom)(this.http.get(url, {
                headers: this.buildAuthHeaders(apiKey),
                validateStatus: (s) => s < 500
            }));
            if (res.status >= 400) {
                result.warnings.push(`Keitaro: группы лендингов — HTTP ${res.status} (поле группы в CRM останется пустым, если имя неизвестно)`);
                return map;
            }
            const data = res.data;
            if (!Array.isArray(data)) {
                result.warnings.push("Keitaro: группы лендингов — не массив в ответе (поле группы в CRM останется пустым, если имя неизвестно)");
                return map;
            }
            for (const row of data) {
                if (!row || typeof row !== "object")
                    continue;
                const g = row;
                const id = typeof g.id === "number" && Number.isFinite(g.id) ? g.id : Number(g.id);
                if (!Number.isFinite(id) || id <= 0)
                    continue;
                const name = String(g.name ?? "").trim();
                if (name.length > 0) {
                    map.set(id, name);
                }
            }
            this.log.log(`Keitaro: загружено имён групп лендингов: ${map.size}`);
        }
        catch (e) {
            const err = e instanceof Error ? e.message : String(e);
            result.warnings.push(`Keitaro: не удалось загрузить группы лендингов — ${err} (имя группы в CRM будет пустым, если неизвестно)`);
        }
        return map;
    }
    buildLandingsGroupsUrl(baseUrl) {
        const raw = this.cfg.get("KEITARO_LANDINGS_GROUPS_ENDPOINT", "/admin_api/v1/groups").trim();
        const base = baseUrl.replace(/\/+$/, "");
        let path = raw.startsWith("/") ? raw : `/${raw}`;
        if (!/[?&]type=/.test(path)) {
            path += path.includes("?") ? "&type=landings" : "?type=landings";
        }
        return `${base}${path}`;
    }
    resolveCrmGroupName(groupId, groupNames) {
        if (groupId == null) {
            return "";
        }
        const label = groupNames.get(groupId);
        if (label != null && label.length > 0) {
            return label;
        }
        return "";
    }
    resolveCrmOfferGroupName(item, groupId, offerGroupNames) {
        const fromPayload = item.group != null ? String(item.group).trim() : "";
        if (fromPayload.length > 0) {
            return fromPayload;
        }
        return this.resolveCrmGroupName(groupId, offerGroupNames);
    }
    extractOffersListPayload(data, warnings, page) {
        if (Array.isArray(data)) {
            return data;
        }
        if (data != null && typeof data === "object") {
            const o = data;
            for (const key of ["offers", "rows", "data", "items"]) {
                const inner = o[key];
                if (Array.isArray(inner)) {
                    this.log.log(`Keitaro fetchOffers: ответ-объект, массив в поле "${key}" (page=${page})`);
                    return inner;
                }
            }
        }
        const msg = `Keitaro fetchOffers: неожиданный ответ (нет массива офферов) на page=${page}`;
        this.log.warn(msg);
        warnings?.push(msg);
        return null;
    }
    buildOfferByIdUrl(baseUrl, keitaroOfferId) {
        const listPath = this.cfg.get("KEITARO_OFFERS_ENDPOINT", "/admin_api/v1/offers").trim();
        const base = baseUrl.replace(/\/+$/, "");
        const path = listPath.startsWith("/") ? listPath : `/${listPath}`;
        const trimmed = path.replace(/\/+$/, "");
        return `${base}${trimmed}/${keitaroOfferId}`;
    }
    buildPagedUrl(baseUrl, endpoint, page, perPage) {
        const base = baseUrl.replace(/\/+$/, "");
        const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
        const sep = path.includes("?") ? "&" : "?";
        return `${base}${path}${sep}page=${page}&per_page=${perPage}`;
    }
    buildAuthHeaders(apiKey) {
        const authType = (this.cfg.get("KEITARO_AUTH_TYPE", "api-key") || "api-key").toLowerCase().trim();
        const headers = {
            "User-Agent": keitaro_http_constants_1.KEITARO_HTTP_USER_AGENT,
            Accept: "application/json"
        };
        if (authType === "bearer") {
            headers.Authorization = `Bearer ${apiKey}`;
        }
        else {
            headers["Api-Key"] = apiKey;
        }
        return headers;
    }
    async upsertOneLanding(raw, landingGroupNames) {
        if (!raw || typeof raw !== "object") {
            return "skipped";
        }
        const item = raw;
        const kid = typeof item.id === "number" && Number.isFinite(item.id) ? item.id : Number(item.id);
        if (!Number.isFinite(kid) || kid <= 0) {
            return "skipped";
        }
        const landingKey = { keitaroId: kid, recordType: "landing" };
        const before = await this.prisma.landing.findUnique({
            where: { keitaroId_recordType: landingKey }
        });
        const name = String(item.name ?? "").trim() || `Keitaro #${kid}`;
        const groupId = typeof item.group_id === "number" && Number.isFinite(item.group_id) ? item.group_id : null;
        const state = item.state != null ? String(item.state) : null;
        const localPath = item.local_path != null ? String(item.local_path) : null;
        const previewPath = item.preview_path != null ? String(item.preview_path) : null;
        const landingType = item.landing_type != null ? String(item.landing_type) : null;
        const createdAt = this.parseDate(item.created_at);
        const updatedAt = this.parseDate(item.updated_at);
        const groupName = this.resolveCrmGroupName(groupId, landingGroupNames);
        const status = this.mapStateToCrmStatus(state);
        const updateData = {
            name,
            groupId,
            state,
            localPath,
            previewPath,
            landingType,
            groupName,
            recordType: "landing",
            status
        };
        if (updatedAt) {
            updateData.updatedAt = updatedAt;
        }
        await this.prisma.landing.upsert({
            where: { keitaroId_recordType: landingKey },
            create: {
                keitaroId: kid,
                name,
                groupId,
                state,
                localPath,
                previewPath,
                landingType,
                groupName,
                recordType: "landing",
                status,
                roi: null,
                conversion: null,
                cr: null,
                crc: null,
                createdAt: createdAt ?? undefined,
                updatedAt: updatedAt ?? createdAt ?? undefined
            },
            update: updateData
        });
        return before ? "updated" : "added";
    }
    async upsertOneOffer(raw, offerGroupNames) {
        if (!raw || typeof raw !== "object") {
            return "skipped";
        }
        const item = raw;
        const kid = typeof item.id === "number" && Number.isFinite(item.id) ? item.id : Number(item.id);
        if (!Number.isFinite(kid) || kid <= 0) {
            return "skipped";
        }
        const offerKey = { keitaroId: kid, recordType: "offer" };
        const before = await this.prisma.landing.findUnique({
            where: { keitaroId_recordType: offerKey }
        });
        const name = String(item.name ?? "").trim() || `Keitaro offer #${kid}`;
        const groupId = typeof item.group_id === "number" && Number.isFinite(item.group_id) ? item.group_id : null;
        const state = item.state != null ? String(item.state) : null;
        const localPath = item.local_path != null ? String(item.local_path) : null;
        const previewPath = item.preview_path != null ? String(item.preview_path) : null;
        const landingType = item.action_type != null && String(item.action_type).trim() !== ""
            ? String(item.action_type)
            : item.offer_type != null && String(item.offer_type).trim() !== ""
                ? String(item.offer_type)
                : null;
        const createdAt = this.parseDate(item.created_at);
        const updatedAt = this.parseDate(item.updated_at);
        const groupName = this.resolveCrmOfferGroupName(item, groupId, offerGroupNames);
        const status = this.mapStateToCrmStatus(state);
        const updateData = {
            name,
            groupId,
            state,
            localPath,
            previewPath,
            landingType,
            groupName,
            recordType: "offer",
            status
        };
        if (updatedAt) {
            updateData.updatedAt = updatedAt;
        }
        await this.prisma.landing.upsert({
            where: { keitaroId_recordType: offerKey },
            create: {
                keitaroId: kid,
                name,
                groupId,
                state,
                localPath,
                previewPath,
                landingType,
                groupName,
                recordType: "offer",
                status,
                roi: null,
                conversion: null,
                cr: null,
                crc: null,
                createdAt: createdAt ?? undefined,
                updatedAt: updatedAt ?? createdAt ?? undefined
            },
            update: updateData
        });
        return before ? "updated" : "added";
    }
    parseDate(v) {
        if (v == null || v === "")
            return undefined;
        if (v instanceof Date && !Number.isNaN(v.getTime()))
            return v;
        let s = String(v).trim();
        if (!s)
            return undefined;
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
            s = s.replace(" ", "T");
        }
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? undefined : d;
    }
    mapStateToCrmStatus(state) {
        if (!state)
            return "inactive";
        const s = state.toLowerCase();
        if (s.includes("active") || s === "on" || s === "enabled" || s === "1") {
            return "active";
        }
        return "inactive";
    }
};
exports.KeitaroService = KeitaroService;
exports.KeitaroService = KeitaroService = KeitaroService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], KeitaroService);
//# sourceMappingURL=keitaro.service.js.map