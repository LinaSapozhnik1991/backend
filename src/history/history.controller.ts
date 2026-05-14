import { Body, Controller, Get, NotFoundException, Param, UnprocessableEntityException, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { JwtUser } from "../auth/jwt.util";
import { CurrentUser } from "../common/current-user.decorator";
import { PrismaService } from "../database/prisma.service";
import { LandingsService } from "../landings/landings.service";

@Controller("history")
@UseGuards(AuthGuard)
export class HistoryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly landingsService: LandingsService
  ) {}

  @Get(":landingId")
  async list(@CurrentUser() user: JwtUser, @Param("landingId") landingId: string) {
    const lid = +landingId;
    if (lid <= 0) throw new UnprocessableEntityException({ error: "landing_id обязателен" });
    const row = await this.prisma.landing.findUnique({ where: { id: lid } });
    if (!row) throw new NotFoundException({ error: "Запись не найдена" });
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
}
