import { Injectable, UnauthorizedException, UnprocessableEntityException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { inferUserRole } from "./roles.util";
import { signAccessToken } from "./jwt.util";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async login(login: string, password: string): Promise<{ token: string; user: { id: number; login: string; role: string } }> {
    const l = login.trim();
    if (l === "" || password === "") {
      throw new UnprocessableEntityException({ error: "Логин и пароль обязательны" });
    }
    const row = await this.prisma.user.findUnique({ where: { login: l } });
    const hash = row?.passwordHash && row.passwordHash !== "" ? row.passwordHash : null;
    let passwordOk = false;
    if (hash) {
      try {
        passwordOk = await bcrypt.compare(password, hash);
      } catch {
        passwordOk = false;
      }
    }
    if (!row || !hash || !passwordOk) {
      throw new UnauthorizedException({ error: "Неверные учетные данные" });
    }
    const role = inferUserRole(row) as "admin" | "manager" | "editor";
    const secret = this.config.get<string>("JWT_SECRET") || "dev_secret";
    const token = signAccessToken({ id: row.id, login: row.login, role }, secret);
    return { token, user: { id: row.id, login: row.login, role } };
  }
}
