import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { PrismaService } from "../database/prisma.service";
import type { SyncResultDto } from "./dto/sync-result.dto";
import { KEITARO_HTTP_USER_AGENT } from "./keitaro-http.constants";
import type { KeitaroLandingPage, KeitaroLandingsGroup } from "./interfaces/keitaro-landing-page.interface";
import type { KeitaroOffer } from "./interfaces/keitaro-offer.interface";

/** Узкий тип для upsert/find по паре (keitaro_id, record_type) после `prisma generate`. */
type LandingKeitaroWhere = { keitaroId: number; recordType: string };
type LandingPrismaDelegate = {
  findUnique(args: { where: { keitaroId_recordType: LandingKeitaroWhere } }): Promise<{ id: number } | null>;
  upsert(args: {
    where: { keitaroId_recordType: LandingKeitaroWhere };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }): Promise<unknown>;
};

const MAX_SYNC_PAGES = 500;
const DEFAULT_PER_PAGE = 100;

@Injectable()
export class KeitaroService {
  private readonly log = new Logger(KeitaroService.name);

  constructor(
    private readonly http: HttpService,
    private readonly cfg: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * GET /admin_api/v1/offers — список офферов Keitaro (с теми же query `page`, `per_page`, что и landing_pages).
   * Без ключей в .env возвращает пустой массив и пишет предупреждение в лог.
   * @param warnings если передан, туда же попадают сообщения об ошибках HTTP/сети (для sync).
   */
  async fetchOffers(warnings?: string[]): Promise<KeitaroOffer[]> {
    const baseUrl = this.cfg.get<string>("KEITARO_BASE_URL", "").trim();
    const apiKey = this.cfg.get<string>("KEITARO_API_KEY", "").trim();
    if (!baseUrl || !apiKey) {
      const msg = "Keitaro fetchOffers: пропуск — не заданы KEITARO_BASE_URL или KEITARO_API_KEY";
      this.log.warn(msg);
      warnings?.push(msg);
      return [];
    }

    const endpoint = this.cfg.get<string>("KEITARO_OFFERS_ENDPOINT", "/admin_api/v1/offers").trim();
    const perPage = Math.min(
      Math.max(1, +(this.cfg.get<string>("KEITARO_OFFERS_PER_PAGE") ?? String(DEFAULT_PER_PAGE))),
      500
    );

    const all: KeitaroOffer[] = [];
    let page = 1;

    while (page <= MAX_SYNC_PAGES) {
      const url = this.buildPagedUrl(baseUrl, endpoint, page, perPage);
      try {
        const res = await firstValueFrom(
          this.http.get<unknown>(url, {
            headers: this.buildAuthHeaders(apiKey),
            validateStatus: (s) => s < 500
          })
        );
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
            all.push(raw as KeitaroOffer);
          }
        }
        if (data.length < perPage) {
          break;
        }
        /**
         * У части инсталляций Keitaro GET /offers отдаёт весь каталог на любой page, игнорируя per_page.
         * Тогда data.length > perPage — если крутить «следующую страницу», накапливаются дубликаты до лимита
         * страниц (OOM / таймаут) и upsert офферов не доходит.
         */
        if (data.length > perPage) {
          this.log.warn(
            `Keitaro fetchOffers: page=${page} вернуло ${data.length} элементов при per_page=${perPage} — ответ без пагинации, остановка после одной порции`
          );
          break;
        }
        page += 1;
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        const msg = `Keitaro fetchOffers: запрос page=${page} — ${err}`;
        this.log.warn(msg);
        warnings?.push(msg);
        if (/socket|tls|ssl|handshake|secure/i.test(err)) {
          warnings?.push(
            "Keitaro TLS (offers): проверьте HTTP(S)_PROXY у процесса Node, сеть/VPN; при доверенном трекере с проблемным сертификатом — KEITARO_TLS_REJECT_UNAUTHORIZED=false в backend/.env."
          );
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

  /**
   * GET `/admin_api/v1/offers/{id}` — один оффер (тот же набор полей, что у элемента списка `GET …/offers`).
   * Удобно для отладки; синк по умолчанию идёт по списку без N запросов по id.
   */
  async fetchOfferById(keitaroOfferId: number, warnings?: string[]): Promise<KeitaroOffer | null> {
    const baseUrl = this.cfg.get<string>("KEITARO_BASE_URL", "").trim();
    const apiKey = this.cfg.get<string>("KEITARO_API_KEY", "").trim();
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
      const res = await firstValueFrom(
        this.http.get<unknown>(url, {
          headers: this.buildAuthHeaders(apiKey),
          validateStatus: (s) => s < 500
        })
      );
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
      const offer = body as KeitaroOffer;
      const id = typeof offer.id === "number" && Number.isFinite(offer.id) ? offer.id : Number(offer.id);
      if (!Number.isFinite(id) || id <= 0) {
        warnings?.push(`Keitaro fetchOfferById: в ответе нет валидного id (запрос id=${keitaroOfferId})`);
        return null;
      }
      return offer;
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      warnings?.push(`Keitaro fetchOfferById: id=${keitaroOfferId} — ${err}`);
      this.log.warn(`Keitaro fetchOfferById: id=${keitaroOfferId} — ${err}`);
      return null;
    }
  }

  /**
   * Синхронизация landing_pages и offers из Keitaro в таблицу landings (upsert по паре keitaro_id + record_type).
   * Статистика roi/conversion/cr/crc не трогается (остаётся как в БД / null).
   * Ошибка одной фазы не отменяет вторую; критичные сбои попадают в warnings.
   */
  async syncLandings(): Promise<SyncResultDto> {
    const z = (): SyncResultDto["landings"] => ({ added: 0, updated: 0, skipped: 0 });
    const result: SyncResultDto = { landings: z(), offers: z(), warnings: [] };
    try {
      await this.executeKeitaroLandingsSync(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.error(`Keitaro sync (landings): ${msg}`, e instanceof Error ? e.stack : undefined);
      result.warnings.push(`Keitaro (лендинги): сбой синхронизации — ${msg}`);
    }
    try {
      await this.executeKeitaroOffersSync(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.error(`Keitaro sync (offers): ${msg}`, e instanceof Error ? e.stack : undefined);
      result.warnings.push(`Keitaro (офферы): сбой синхронизации — ${msg}`);
    }
    return result;
  }

  private async executeKeitaroLandingsSync(result: SyncResultDto): Promise<void> {
    const baseUrl = this.cfg.get<string>("KEITARO_BASE_URL", "").trim();
    const apiKey = this.cfg.get<string>("KEITARO_API_KEY", "").trim();
    if (!baseUrl || !apiKey) {
      const msg = "Keitaro: пропуск синхронизации — не заданы KEITARO_BASE_URL или KEITARO_API_KEY";
      this.log.warn(msg);
      result.warnings.push(msg);
      return;
    }

    const endpoint = this.cfg.get<string>("KEITARO_LANDINGS_ENDPOINT", "/admin_api/v1/landing_pages").trim();
    const perPage = Math.min(
      Math.max(1, +(this.cfg.get<string>("KEITARO_LANDINGS_PER_PAGE") ?? String(DEFAULT_PER_PAGE))),
      500
    );

    const landingGroupNames = await this.fetchKeitaroLandingGroupNames(baseUrl, apiKey, result);

    let page = 1;
    while (page <= MAX_SYNC_PAGES) {
      const url = this.buildPagedUrl(baseUrl, endpoint, page, perPage);
      let items: unknown[];
      try {
        const res = await firstValueFrom(
          this.http.get<unknown>(url, {
            headers: this.buildAuthHeaders(apiKey),
            validateStatus: (s) => s < 500
          })
        );
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
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        result.warnings.push(`Keitaro: запрос page=${page} — ${err}`);
        if (/socket|tls|ssl|handshake|secure/i.test(err)) {
          result.warnings.push(
            "Keitaro TLS: проверьте HTTP(S)_PROXY у процесса Node, сеть/VPN; при доверенном трекере с проблемным сертификатом — KEITARO_TLS_REJECT_UNAUTHORIZED=false в backend/.env."
          );
        }
        break;
      }

      if (items.length === 0) {
        break;
      }

      for (const raw of items) {
        try {
          const r = await this.upsertOneLanding(raw, landingGroupNames);
          if (r === "added") result.landings.added += 1;
          else if (r === "updated") result.landings.updated += 1;
          else result.landings.skipped += 1;
        } catch (e) {
          const err = e instanceof Error ? e.message : String(e);
          result.warnings.push(`Keitaro: элемент пропущен — ${err}`);
          result.landings.skipped += 1;
        }
      }

      if (items.length > perPage) {
        this.log.warn(
          `Keitaro: landing_pages page=${page} вернуло ${items.length} элементов при per_page=${perPage} — ответ без пагинации, остановка после одной порции`
        );
        break;
      }

      page += 1;
    }

    if (page > MAX_SYNC_PAGES) {
      result.warnings.push(`Keitaro: достигнут лимит страниц (${MAX_SYNC_PAGES}), остановка`);
    }

    this.log.log(
      `Keitaro sync landings: added=${result.landings.added} updated=${result.landings.updated} skipped=${result.landings.skipped} warnings=${result.warnings.length}`
    );
  }

  private async executeKeitaroOffersSync(result: SyncResultDto): Promise<void> {
    const baseUrl = this.cfg.get<string>("KEITARO_BASE_URL", "").trim();
    const apiKey = this.cfg.get<string>("KEITARO_API_KEY", "").trim();
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
        if (r === "added") result.offers.added += 1;
        else if (r === "updated") result.offers.updated += 1;
        else result.offers.skipped += 1;
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        result.warnings.push(`Keitaro (оффер): элемент пропущен — ${err}`);
        result.offers.skipped += 1;
      }
    }

    this.log.log(
      `Keitaro sync offers: added=${result.offers.added} updated=${result.offers.updated} skipped=${result.offers.skipped}`
    );
  }

  /**
   * Имена групп офферов Keitaro (id → name) для поля group_name в CRM.
   * API: GET /admin_api/v1/groups?type=offers
   */
  private async fetchKeitaroOfferGroupNames(
    baseUrl: string,
    apiKey: string,
    result: SyncResultDto
  ): Promise<Map<number, string>> {
    const map = new Map<number, string>();
    const url = this.buildOfferGroupsUrl(baseUrl);
    try {
      const res = await firstValueFrom(
        this.http.get<unknown>(url, {
          headers: this.buildAuthHeaders(apiKey),
          validateStatus: (s) => s < 500
        })
      );
      if (res.status >= 400) {
        result.warnings.push(
          `Keitaro: группы офферов — HTTP ${res.status} (поле группы в CRM останется пустым, если имя неизвестно)`
        );
        return map;
      }
      const data = res.data;
      if (!Array.isArray(data)) {
        result.warnings.push(
          "Keitaro: группы офферов — не массив в ответе (поле группы в CRM останется пустым, если имя неизвестно)"
        );
        return map;
      }
      for (const row of data) {
        if (!row || typeof row !== "object") continue;
        const g = row as KeitaroLandingsGroup;
        const id = typeof g.id === "number" && Number.isFinite(g.id) ? g.id : Number(g.id);
        if (!Number.isFinite(id) || id <= 0) continue;
        const name = String(g.name ?? "").trim();
        if (name.length > 0) {
          map.set(id, name);
        }
      }
      this.log.log(`Keitaro: загружено имён групп офферов: ${map.size}`);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      result.warnings.push(`Keitaro: не удалось загрузить группы офферов — ${err} (имя группы в CRM будет пустым, если неизвестно)`);
    }
    return map;
  }

  /** Путь из KEITARO_OFFERS_GROUPS_ENDPOINT; при отсутствии type= добавляется type=offers. */
  private buildOfferGroupsUrl(baseUrl: string): string {
    const raw = this.cfg.get<string>("KEITARO_OFFERS_GROUPS_ENDPOINT", "/admin_api/v1/groups").trim();
    const base = baseUrl.replace(/\/+$/, "");
    let path = raw.startsWith("/") ? raw : `/${raw}`;
    if (!/[?&]type=/.test(path)) {
      path += path.includes("?") ? "&type=offers" : "?type=offers";
    }
    return `${base}${path}`;
  }

  /**
   * Имена групп лендингов Keitaro (id → name) для поля group_name в CRM.
   * API: GET /admin_api/v1/groups?type=landings
   */
  private async fetchKeitaroLandingGroupNames(
    baseUrl: string,
    apiKey: string,
    result: SyncResultDto
  ): Promise<Map<number, string>> {
    const map = new Map<number, string>();
    const url = this.buildLandingsGroupsUrl(baseUrl);
    try {
      const res = await firstValueFrom(
        this.http.get<unknown>(url, {
          headers: this.buildAuthHeaders(apiKey),
          validateStatus: (s) => s < 500
        })
      );
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
        if (!row || typeof row !== "object") continue;
        const g = row as KeitaroLandingsGroup;
        const id = typeof g.id === "number" && Number.isFinite(g.id) ? g.id : Number(g.id);
        if (!Number.isFinite(id) || id <= 0) continue;
        const name = String(g.name ?? "").trim();
        if (name.length > 0) {
          map.set(id, name);
        }
      }
      this.log.log(`Keitaro: загружено имён групп лендингов: ${map.size}`);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      result.warnings.push(`Keitaro: не удалось загрузить группы лендингов — ${err} (имя группы в CRM будет пустым, если неизвестно)`);
    }
    return map;
  }

  /** Путь из KEITARO_LANDINGS_GROUPS_ENDPOINT; при отсутствии type= добавляется type=landings. */
  private buildLandingsGroupsUrl(baseUrl: string): string {
    const raw = this.cfg.get<string>("KEITARO_LANDINGS_GROUPS_ENDPOINT", "/admin_api/v1/groups").trim();
    const base = baseUrl.replace(/\/+$/, "");
    let path = raw.startsWith("/") ? raw : `/${raw}`;
    if (!/[?&]type=/.test(path)) {
      path += path.includes("?") ? "&type=landings" : "?type=landings";
    }
    return `${base}${path}`;
  }

  /** Пустая строка, если в Keitaro нет группы или нет человекочитаемого имени в справочнике групп. */
  private resolveCrmGroupName(groupId: number | null, groupNames: Map<number, string>): string {
    if (groupId == null) {
      return "";
    }
    const label = groupNames.get(groupId);
    if (label != null && label.length > 0) {
      return label;
    }
    return "";
  }

  /**
   * Имя группы для оффера: приоритет полю `group` из ответа Keitaro, иначе справочник по group_id.
   */
  private resolveCrmOfferGroupName(item: KeitaroOffer, groupId: number | null, offerGroupNames: Map<number, string>): string {
    const fromPayload = item.group != null ? String(item.group).trim() : "";
    if (fromPayload.length > 0) {
      return fromPayload;
    }
    return this.resolveCrmGroupName(groupId, offerGroupNames);
  }

  /**
   * Ответ списка офферов: чаще всего массив; иногда объект с массивом в поле (например `data`, `rows`).
   */
  private extractOffersListPayload(data: unknown, warnings: string[] | undefined, page: number): unknown[] | null {
    if (Array.isArray(data)) {
      return data;
    }
    if (data != null && typeof data === "object") {
      const o = data as Record<string, unknown>;
      for (const key of ["offers", "rows", "data", "items"] as const) {
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

  /** URL GET …/offers/{id} из `KEITARO_OFFERS_ENDPOINT` (без query page/per_page). */
  private buildOfferByIdUrl(baseUrl: string, keitaroOfferId: number): string {
    const listPath = this.cfg.get<string>("KEITARO_OFFERS_ENDPOINT", "/admin_api/v1/offers").trim();
    const base = baseUrl.replace(/\/+$/, "");
    const path = listPath.startsWith("/") ? listPath : `/${listPath}`;
    const trimmed = path.replace(/\/+$/, "");
    return `${base}${trimmed}/${keitaroOfferId}`;
  }

  private buildPagedUrl(baseUrl: string, endpoint: string, page: number, perPage: number): string {
    const base = baseUrl.replace(/\/+$/, "");
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const sep = path.includes("?") ? "&" : "?";
    return `${base}${path}${sep}page=${page}&per_page=${perPage}`;
  }

  private buildAuthHeaders(apiKey: string): Record<string, string> {
    const authType = (this.cfg.get<string>("KEITARO_AUTH_TYPE", "api-key") || "api-key").toLowerCase().trim();
    const headers: Record<string, string> = {
      "User-Agent": KEITARO_HTTP_USER_AGENT,
      Accept: "application/json"
    };
    if (authType === "bearer") {
      headers.Authorization = `Bearer ${apiKey}`;
    } else {
      headers["Api-Key"] = apiKey;
    }
    return headers;
  }

  private async upsertOneLanding(raw: unknown, landingGroupNames: Map<number, string>): Promise<"added" | "updated" | "skipped"> {
    if (!raw || typeof raw !== "object") {
      return "skipped";
    }
    const item = raw as KeitaroLandingPage;
    const kid = typeof item.id === "number" && Number.isFinite(item.id) ? item.id : Number(item.id);
    if (!Number.isFinite(kid) || kid <= 0) {
      return "skipped";
    }

    const landingKey: LandingKeitaroWhere = { keitaroId: kid, recordType: "landing" };
    const before = await (this.prisma.landing as unknown as LandingPrismaDelegate).findUnique({
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

    const updateData: Record<string, unknown> = {
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

    await (this.prisma.landing as unknown as LandingPrismaDelegate).upsert({
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

  private async upsertOneOffer(raw: unknown, offerGroupNames: Map<number, string>): Promise<"added" | "updated" | "skipped"> {
    if (!raw || typeof raw !== "object") {
      return "skipped";
    }
    const item = raw as KeitaroOffer;
    const kid = typeof item.id === "number" && Number.isFinite(item.id) ? item.id : Number(item.id);
    if (!Number.isFinite(kid) || kid <= 0) {
      return "skipped";
    }

    const offerKey: LandingKeitaroWhere = { keitaroId: kid, recordType: "offer" };
    const before = await (this.prisma.landing as unknown as LandingPrismaDelegate).findUnique({
      where: { keitaroId_recordType: offerKey }
    });
    const name = String(item.name ?? "").trim() || `Keitaro offer #${kid}`;
    const groupId = typeof item.group_id === "number" && Number.isFinite(item.group_id) ? item.group_id : null;
    const state = item.state != null ? String(item.state) : null;
    const localPath = item.local_path != null ? String(item.local_path) : null;
    const previewPath = item.preview_path != null ? String(item.preview_path) : null;
    const landingType =
      item.action_type != null && String(item.action_type).trim() !== ""
        ? String(item.action_type)
        : item.offer_type != null && String(item.offer_type).trim() !== ""
          ? String(item.offer_type)
          : null;
    const createdAt = this.parseDate(item.created_at);
    const updatedAt = this.parseDate(item.updated_at);
    const groupName = this.resolveCrmOfferGroupName(item, groupId, offerGroupNames);
    const status = this.mapStateToCrmStatus(state);

    const updateData: Record<string, unknown> = {
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

    await (this.prisma.landing as unknown as LandingPrismaDelegate).upsert({
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

  private parseDate(v: unknown): Date | undefined {
    if (v == null || v === "") return undefined;
    if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
    let s = String(v).trim();
    if (!s) return undefined;
    // Keitaro часто отдаёт "YYYY-MM-DD HH:mm:ss" без таймзоны
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
      s = s.replace(" ", "T");
    }
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }

  /** Маппинг state Keitaro → active/inactive для поля status CRM */
  private mapStateToCrmStatus(state: string | null): string {
    if (!state) return "inactive";
    const s = state.toLowerCase();
    if (s.includes("active") || s === "on" || s === "enabled" || s === "1") {
      return "active";
    }
    return "inactive";
  }
}
