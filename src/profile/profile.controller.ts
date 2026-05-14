import { Body, Controller, Get, NotFoundException, Patch, Put, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { JwtUser } from "../auth/jwt.util";
import { inferUserRole } from "../auth/roles.util";
import { CurrentUser } from "../common/current-user.decorator";
import { PrismaService } from "../database/prisma.service";
import { UsersService } from "../users/users.service";

@Controller("profile")
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService
  ) {}

  @Get()
  async getProfile(@CurrentUser() actor: JwtUser) {
    const row = await this.prisma.user.findUnique({ where: { id: actor.id } });
    if (!row) throw new NotFoundException({ error: "Пользователь не найден" });
    return {
      user: {
        id: row.id,
        login: row.login,
        role: inferUserRole(row),
        created_at: row.createdAt
      }
    };
  }

  @Patch()
  @Put()
  async patchPassword(
    @CurrentUser() actor: JwtUser,
    @Body() body: { current_password?: string; new_password?: string }
  ) {
    await this.usersService.changePassword(
      actor.id,
      String(body.current_password ?? ""),
      String(body.new_password ?? "")
    );
    return { ok: true };
  }
}
