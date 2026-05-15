import { Controller, Get, Post, HttpCode, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { AuthGuard } from "../auth/auth.guard";
import type { SyncResultDto } from "./dto/sync-result.dto";
import { KeitaroService } from "./keitaro.service";
import { PrismaService } from "../database/prisma.service";

// Временно убираем защиту, чтобы вызвать /setup-db без токена
// @UseGuards(AuthGuard, AdminGuard)
@Controller("sync")
export class KeitaroController {
  constructor(
    private readonly keitaro: KeitaroService,
    private readonly prisma: PrismaService,   // ← обязательно добавить
  ) {}

  @Post("keitaro")
  @HttpCode(200)
  async runSync(): Promise<SyncResultDto> {
    return this.keitaro.syncLandings();
  }

  // ⬇️ Эндпоинт для создания таблицы users и вставки admin
  @Get("setup-db")
  async setupDatabase() {
    // Создаём таблицу users (если её нет)
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'editor',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Добавляем администратора (пароль: admin123)
    await this.prisma.$executeRaw`
      INSERT INTO users (login, password_hash, role)
      SELECT 'admin', '$2y$10$A5pWaf9phnWz7gzf5c4n6e5wmW8EuLhIwJr4fIFQdy6.G7zLJjL4e', 'admin'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE login = 'admin');
    `;

    return { message: '✅ База данных инициализирована. Теперь можно войти admin/admin123' };
  }
}