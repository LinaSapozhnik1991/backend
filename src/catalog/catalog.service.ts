import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { canonicalTemplateKey } from "../common/template-key.util";
import { clearPublicConfigCache } from "../public/public-config-cache";

export type CatalogItemDto = { key: string; name: string };

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listWidgets(): Promise<CatalogItemDto[]> {
    const rows = await this.prisma.widgetCatalog.findMany({
      orderBy: [{ sortOrder: "asc" }, { widgetKey: "asc" }]
    });
    return rows.map((r) => ({ key: r.widgetKey, name: r.widgetName }));
  }

  async listScripts(): Promise<CatalogItemDto[]> {
    const rows = await this.prisma.scriptCatalog.findMany({
      orderBy: [{ sortOrder: "asc" }, { scriptKey: "asc" }]
    });
    return rows.map((r) => ({ key: r.scriptKey, name: r.scriptName }));
  }

  async replaceWidgets(items: CatalogItemDto[]): Promise<CatalogItemDto[]> {
    const normalized = items.map((it) => ({
      key: canonicalTemplateKey(String(it.key ?? "")),
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
      } else {
        const keys = deduped.map((x) => x.key);
        await tx.widgetRow.deleteMany({ where: { widgetKey: { notIn: keys } } });
      }
    });
    clearPublicConfigCache();
    return this.listWidgets();
  }

  async replaceScripts(items: CatalogItemDto[]): Promise<CatalogItemDto[]> {
    const normalized = items.map((it) => ({
      key: canonicalTemplateKey(String(it.key ?? "")),
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
      } else {
        const keys = deduped.map((x) => x.key);
        await tx.scriptRow.deleteMany({ where: { scriptKey: { notIn: keys } } });
      }
    });
    clearPublicConfigCache();
    return this.listScripts();
  }

  async mergedWidgetsForLanding(landingId: number): Promise<
    Array<{ id: number; key: string; name: string; is_enabled: boolean; sort_order: number }>
  > {
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

  async mergedScriptsForLanding(landingId: number): Promise<
    Array<{ id: number; key: string; name: string; is_enabled: boolean; sort_order: number }>
  > {
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

  private dedupe(items: CatalogItemDto[]): CatalogItemDto[] {
    const map = new Map<string, string>();
    for (const it of items) {
      const k = String(it.key ?? "").trim();
      const n = String(it.name ?? "").trim();
      if (k === "" || n === "") continue;
      map.set(k, n);
    }
    return Array.from(map.entries()).map(([key, name]) => ({ key, name }));
  }
}
