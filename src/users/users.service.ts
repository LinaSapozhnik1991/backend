import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { signAccessToken } from "../auth/jwt.util";
import type { JwtUser } from "../auth/jwt.util";
import { inferUserRole } from "../auth/roles.util";
import { CounterService } from "../database/counter.service";
import { PrismaService } from "../database/prisma.service";
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly counter: CounterService
  ) {}

  async list(): Promise<Record<string, unknown>[]> {
    const rows = await this.prisma.user.findMany({ orderBy: { id: "asc" } });
    return rows.map((r) => ({
      id: r.id,
      login: r.login,
      role: inferUserRole(r),
      created_at: r.createdAt
    }));
  }

  async getOne(id: number): Promise<Record<string, unknown>> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    if (!row) throw new NotFoundException({ error: "Пользователь не найден" });
    return {
      id: row.id,
      login: row.login,
      role: inferUserRole(row),
      created_at: row.createdAt
    };
  }

  async create(body: { login?: string; password?: string; role?: string }): Promise<{
    user: { id: number; login: string; role: string };
    temporary_password?: string;
  }> {
    const login = String(body.login ?? "").trim();
    if (login === "" || login.length > 100) {
      throw new UnprocessableEntityException({ error: "Логин обязателен (до 100 символов)" });
    }
    const role = String(body.role ?? "editor");
    if (!["admin", "editor", "manager"].includes(role)) {
      throw new UnprocessableEntityException({ error: "Недопустимая роль" });
    }
    const exists = await this.prisma.user.findUnique({ where: { login } });
    if (exists) throw new ConflictException({ error: "Пользователь с таким логином уже есть" });
    let plain = String(body.password ?? "");
    let temp: string | undefined;
    if (plain === "") {
      const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
      temp = "";
      for (let i = 0; i < 14; i++) temp += chars[Math.floor(Math.random() * chars.length)];
      plain = temp;
    }
    if (plain.length < 8) {
      throw new UnprocessableEntityException({
        error: "Пароль не короче 8 символов (или оставьте пустым для автогенерации)"
      });
    }
    const hash = await bcrypt.hash(plain, 10);
    const uid = await this.counter.next("users");
    const now = new Date();
    await this.prisma.user.create({
      data: {
        id: uid,
        login,
        passwordHash: hash,
        role,
        createdAt: now,
        updatedAt: now
      }
    });
    const out: { user: { id: number; login: string; role: string }; temporary_password?: string } = {
      user: { id: uid, login, role }
    };
    if (temp !== undefined) out.temporary_password = temp;
    return out;
  }

  async updateRole(
    id: number,
    body: { role?: string },
    actor: JwtUser,
    jwtSecret: string
  ): Promise<{ user: { id: number; login: string; role: string }; token?: string }> {
    const newRole = String(body.role ?? "");
    if (!["admin", "editor", "manager"].includes(newRole)) {
      throw new UnprocessableEntityException({ error: "Недопустимая роль" });
    }
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException({ error: "Пользователь не найден" });
    const currentRole = inferUserRole(target);
    if (currentRole === "admin" && newRole !== "admin") {
      const cnt = await this.prisma.user.count({ where: { role: "admin" } });
      if (cnt <= 1) {
        throw new BadRequestException({ error: "Нельзя снять роль администратора с последнего администратора" });
      }
    }
    await this.prisma.user.update({ where: { id }, data: { role: newRole } });
    const out: { user: { id: number; login: string; role: string }; token?: string } = {
      user: { id, login: target.login, role: newRole }
    };
    if (id === actor.id) {
      out.token = signAccessToken(
        { id, login: target.login, role: newRole as "admin" | "manager" | "editor" },
        jwtSecret
      );
    }
    return out;
  }

  async remove(id: number, actor: JwtUser): Promise<{ ok: boolean }> {
    if (id === actor.id) {
      throw new BadRequestException({ error: "Нельзя удалить собственную учётную запись" });
    }
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException({ error: "Пользователь не найден" });
    const targetRole = inferUserRole(target);
    if (targetRole === "admin") {
      const cnt = await this.prisma.user.count({ where: { role: "admin" } });
      if (cnt <= 1) {
        throw new BadRequestException({ error: "Нельзя удалить последнего администратора" });
      }
    }
    await this.prisma.historyEntry.deleteMany({ where: { userId: id } });
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  async changePassword(actorId: number, current: string, next: string): Promise<void> {
    if (current === "" || next.length < 8) {
      throw new UnprocessableEntityException({
        error: "Укажите текущий пароль и новый пароль (не короче 8 символов)."
      });
    }
    const u = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!u) throw new NotFoundException({ error: "Пользователь не найден" });
    const ok = await bcrypt.compare(current, u.passwordHash);
    if (!ok) throw new UnauthorizedException({ error: "Неверный текущий пароль" });
    const hash = await bcrypt.hash(next, 10);
    await this.prisma.user.update({ where: { id: actorId }, data: { passwordHash: hash } });
  }
}
