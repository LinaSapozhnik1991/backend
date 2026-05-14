import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import type { JwtUser } from "../auth/jwt.util";
import { hasLandingsFullAccess } from "../auth/roles.util";
import { CatalogService } from "../catalog/catalog.service";
import { CounterService } from "../database/counter.service";
import { PrismaService } from "../database/prisma.service";

/** Строка landing из Prisma для сериализации (без импорта `Landing` из `@prisma/client`). */
type LandingRowForApi = {
  id: number;
  name: string;
  groupName: string;
  recordType: string;
  status: string;
  roi: unknown;
  conversion: unknown;
  cr: unknown;
  crc: unknown;
  createdAt: Date | null;
  updatedAt: Date | null;
  keitaroId?: number | null;
  groupId?: number | null;
  state?: string | null;
  localPath?: string | null;
  previewPath?: string | null;
  landingType?: string | null;
};

function metricToNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (
    typeof v === "object" &&
    v !== null &&
    "toNumber" in v &&
    typeof (v as { toNumber: () => number }).toNumber === "function"
  ) {
    return (v as { toNumber: () => number }).toNumber();
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export type RecordScope = "landing" | "offer";

export interface ToggleDto {
  id?: number;
  key: string;
  name: string;
  is_enabled?: boolean;
  sort_order?: number;
}

export interface SettingDto {
  key: string;
  value: string;
}

export interface SaveLandingBody {
  name?: string;
  group_name?: string;
  record_type?: string;
  status?: string;
  widgets?: ToggleDto[];
  scripts?: ToggleDto[];
  settings?: SettingDto[];
}

type LandingLean = LandingRowForApi;

@Injectable()
export class LandingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly counter: CounterService
  ) {}

  assertOfferLandingAccess(user: JwtUser, recordType: string): void {
    if (hasLandingsFullAccess(user.role)) return;
    if (recordType !== "offer") {
      throw new ForbiddenException({
        error: "Доступ только к офферам. Лендинги доступны администратору и менеджеру."
      });
    }
  }

  assertRecordMatchesScope(scope: RecordScope, recordType: string): void {
    const rt = recordType === "landing" ? "landing" : "offer";
    if (scope === "landing" && rt !== "landing") {
      throw new NotFoundException({ error: "Запись не найдена" });
    }
    if (scope === "offer" && rt !== "offer") {
      throw new NotFoundException({ error: "Запись не найдена" });
    }
  }

  async list(scope: RecordScope, user: JwtUser): Promise<Record<string, unknown>[]> {
    if (scope === "landing") {
      if (!hasLandingsFullAccess(user.role)) {
        throw new ForbiddenException({ error: "Нет доступа к списку лендингов" });
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

  serializeLandingRow(l: LandingLean): Record<string, unknown> {
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

  async getDetails(landingId: number): Promise<Record<string, unknown>> {
    const landing = await this.prisma.landing.findUnique({ where: { id: landingId } });
    if (!landing) {
      throw new NotFoundException({ error: "Лендинг не найден" });
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

  async getOne(scope: RecordScope, user: JwtUser, id: number): Promise<Record<string, unknown>> {
    const details = await this.getDetails(id);
    const landing = details.landing as Record<string, unknown>;
    const rt = String(landing.record_type ?? "offer");
    this.assertRecordMatchesScope(scope, rt);
    this.assertOfferLandingAccess(user, rt);
    return details;
  }

  async create(scope: RecordScope, user: JwtUser, body: SaveLandingBody): Promise<Record<string, unknown>> {
    const payload = { ...body };
    if (scope === "landing") {
      if (!hasLandingsFullAccess(user.role)) {
        throw new ForbiddenException({
          error: "Создавать записи типа «лендинг» может только пользователь с полным доступом к лендингам."
        });
      }
      payload.record_type = "landing";
    } else {
      if (!hasLandingsFullAccess(user.role)) {
        if ((payload.record_type ?? "offer") === "landing") {
          throw new ForbiddenException({ error: "Создавать записи типа «лендинг» может только администратор." });
        }
        payload.record_type = "offer";
      } else {
        payload.record_type = "offer";
      }
    }
    const id = await this.createLandingEntity(payload);
    await this.addHistoryRow(id, user.id, "create", "landing", "name", null, String(payload.name ?? "Новый лендинг"));
    return this.getDetails(id);
  }

  async clone(scope: RecordScope, user: JwtUser, cloneId: number): Promise<Record<string, unknown>> {
    const source = await this.getDetails(cloneId);
    const srcLanding = source.landing as Record<string, unknown>;
    const rt = String(srcLanding.record_type ?? "offer");
    this.assertRecordMatchesScope(scope, rt);
    this.assertOfferLandingAccess(user, rt);
    const recordType = rt === "landing" ? "landing" : "offer";
    const payload: SaveLandingBody = {
      name: String(srcLanding.name ?? "") + " (копия)",
      group_name: String(srcLanding.group_name ?? "default"),
      record_type: recordType,
      status: "inactive",
      widgets: (source.widgets as ToggleDto[]) ?? [],
      scripts: (source.scripts as ToggleDto[]) ?? [],
      settings: (source.settings as SettingDto[]) ?? []
    };
    const newId = await this.createLandingEntity(payload);
    await this.addHistoryRow(newId, user.id, "create", "landing", "clone", null, `Скопирован с ID ${cloneId}`);
    return this.getDetails(newId);
  }

  async update(scope: RecordScope, user: JwtUser, id: number, body: SaveLandingBody): Promise<Record<string, unknown>> {
    const before = await this.getDetails(id);
    const bLanding = before.landing as Record<string, unknown>;
    const rt = String(bLanding.record_type ?? "offer");
    this.assertRecordMatchesScope(scope, rt);
    this.assertOfferLandingAccess(user, rt);
    const payload = { ...body };
    if (scope === "landing") {
      if (!hasLandingsFullAccess(user.role)) {
        throw new ForbiddenException({ error: "Нет доступа к редактированию лендингов" });
      }
      payload.record_type = "landing";
    } else {
      payload.record_type = "offer";
    }
    await this.updateLandingEntity(id, payload, user.id, before);
    return this.getDetails(id);
  }

  async remove(scope: RecordScope, user: JwtUser, id: number): Promise<{ success: boolean }> {
    const beforeDelete = await this.getDetails(id);
    const l = beforeDelete.landing as Record<string, unknown>;
    const rt = String(l.record_type ?? "offer");
    this.assertRecordMatchesScope(scope, rt);
    this.assertOfferLandingAccess(user, rt);
    await this.addHistoryRow(
      id,
      user.id,
      "delete",
      "landing",
      "landing",
      JSON.stringify(beforeDelete),
      null
    );
    await this.prisma.widgetRow.deleteMany({ where: { landingId: id } });
    await this.prisma.scriptRow.deleteMany({ where: { landingId: id } });
    await this.prisma.settingRow.deleteMany({ where: { landingId: id } });
    await this.prisma.historyEntry.deleteMany({ where: { landingId: id } });
    await this.prisma.landing.delete({ where: { id } });
    return { success: true };
  }

  private async createLandingEntity(payload: SaveLandingBody): Promise<number> {
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

  private async updateLandingEntity(
    landingId: number,
    payload: SaveLandingBody,
    userId: number,
    before: Record<string, unknown>
  ): Promise<void> {
    const bLanding = before.landing as Record<string, unknown>;
    const name = String(payload.name ?? bLanding.name ?? "").trim();
    const groupName = String(payload.group_name ?? bLanding.group_name ?? "default").trim();
    const status = (payload.status ?? bLanding.status) === "active" ? "active" : "inactive";
    const recordType =
      (payload.record_type ?? bLanding.record_type ?? "offer") === "landing" ? "landing" : "offer";
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

  private async syncWidgets(landingId: number, list: ToggleDto[]): Promise<void> {
    const catalogRows = await this.prisma.widgetCatalog.findMany({
      orderBy: [{ sortOrder: "asc" }, { widgetKey: "asc" }]
    });
    const byKey = new Map(list.map((w) => [String(w.key ?? ""), w]));
    await this.prisma.widgetRow.deleteMany({ where: { landingId } });
    for (let i = 0; i < catalogRows.length; i++) {
      const c = catalogRows[i]!;
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

  private async syncScripts(landingId: number, list: ToggleDto[]): Promise<void> {
    const catalogRows = await this.prisma.scriptCatalog.findMany({
      orderBy: [{ sortOrder: "asc" }, { scriptKey: "asc" }]
    });
    const byKey = new Map(list.map((s) => [String(s.key ?? ""), s]));
    await this.prisma.scriptRow.deleteMany({ where: { landingId } });
    for (let i = 0; i < catalogRows.length; i++) {
      const c = catalogRows[i]!;
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

  private async syncSettings(landingId: number, list: SettingDto[]): Promise<void> {
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

  private async addHistoryRow(
    landingId: number,
    userId: number,
    action: string,
    entityType: string,
    entityKey: string | null,
    oldValue: string | null,
    newValue: string | null
  ): Promise<void> {
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

  private async createDiffHistory(
    landingId: number,
    userId: number,
    before: Record<string, unknown>,
    after: Record<string, unknown>
  ): Promise<void> {
    const bL = before.landing as Record<string, unknown>;
    const aL = after.landing as Record<string, unknown>;
    if (bL.name !== aL.name) {
      await this.addHistoryRow(landingId, userId, "update", "landing", "name", String(bL.name), String(aL.name));
    }
    if (bL.group_name !== aL.group_name) {
      await this.addHistoryRow(
        landingId,
        userId,
        "update",
        "landing",
        "group_name",
        String(bL.group_name),
        String(aL.group_name)
      );
    }
    if (bL.status !== aL.status) {
      await this.addHistoryRow(landingId, userId, "update", "landing", "status", String(bL.status), String(aL.status));
    }
    if (String(bL.record_type ?? "offer") !== String(aL.record_type ?? "offer")) {
      await this.addHistoryRow(
        landingId,
        userId,
        "update",
        "landing",
        "record_type",
        String(bL.record_type ?? "offer"),
        String(aL.record_type ?? "offer")
      );
    }
    await this.diffToggleList(landingId, userId, before.widgets as ToggleDto[], after.widgets as ToggleDto[], "widget");
    await this.diffToggleList(landingId, userId, before.scripts as ToggleDto[], after.scripts as ToggleDto[], "script");
    await this.diffSettings(landingId, userId, before.settings as SettingDto[], after.settings as SettingDto[]);
  }

  private async diffToggleList(
    landingId: number,
    userId: number,
    before: ToggleDto[],
    after: ToggleDto[],
    entityType: string
  ): Promise<void> {
    const beforeMap = new Map<string, ToggleDto>();
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
        await this.addHistoryRow(
          landingId,
          userId,
          newN === 1 ? "enable" : "disable",
          entityType,
          key,
          oldEn === undefined || oldEn === null ? null : oldEn ? "on" : "off",
          newN === 1 ? "on" : "off"
        );
      }
    }
  }

  private async diffSettings(
    landingId: number,
    userId: number,
    before: SettingDto[],
    after: SettingDto[]
  ): Promise<void> {
    const beforeMap: Record<string, string> = {};
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
}
