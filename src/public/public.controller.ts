import { Controller, Get, Header, NotFoundException, Query, UnprocessableEntityException } from "@nestjs/common";
import { CatalogService } from "../catalog/catalog.service";
import { PrismaService } from "../database/prisma.service";
import { getPublicConfigCache, PUBLIC_CONFIG_TTL_MS } from "./public-config-cache";

@Controller("public")
export class PublicController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService
  ) {}

  @Get("config")
  @Header("Cache-Control", "public, max-age=60")
  async config(@Query("landing_id") landingIdRaw: string) {
    const landingId = +(landingIdRaw ?? "0");
    if (landingId <= 0) {
      throw new UnprocessableEntityException({ error: "landing_id обязателен" });
    }
    const now = Date.now();
    const publicConfigCache = getPublicConfigCache();
    const hit = publicConfigCache.get(landingId);
    if (hit && hit.expires > now) {
      return hit.payload;
    }
    const landing = await this.prisma.landing.findFirst({
      where: { id: landingId, status: "active" }
    });
    if (!landing) {
      throw new NotFoundException({ error: "Активный лендинг не найден" });
    }
    const [mergedW, mergedS, setRows] = await Promise.all([
      this.catalog.mergedWidgetsForLanding(landingId),
      this.catalog.mergedScriptsForLanding(landingId),
      this.prisma.settingRow.findMany({
        where: { landingId },
        orderBy: { id: "asc" }
      })
    ]);
    const settings: Record<string, string> = {};
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
    publicConfigCache.set(landingId, { expires: now + PUBLIC_CONFIG_TTL_MS, payload });
    return payload;
  }
}
