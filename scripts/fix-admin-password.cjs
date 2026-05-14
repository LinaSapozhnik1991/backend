/**
 * Сбрасывает пароль admin на admin123 (bcrypt) или создаёт пользователя admin, если его нет.
 * Читает DATABASE_URL из backend/.env. Запуск: npm run db:fix-admin-password
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const HASH =
  "$2b$12$kqprtWSeEFSGuE0saSqCWe0GtrF3iTq/v3eQa2cnUaAllHtqIXG5y";

function loadEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (t === "" || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

async function main() {
  const envPath = path.join(__dirname, "..", ".env");
  const env = loadEnv(envPath);
  const databaseUrl =
    env.DATABASE_URL ||
    "postgresql://crm:crm@127.0.0.1:5432/crm_landings?schema=public";

  if (!fs.existsSync(envPath)) {
    console.error("Нет файла backend/.env — скопируйте .env.example в .env и задайте DATABASE_URL.");
    process.exit(1);
  }

  process.env.DATABASE_URL = databaseUrl;
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { login: "admin" } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: HASH }
      });
      console.log("Готово: у пользователя admin обновлён пароль (логин admin, пароль admin123).");
      return;
    }

    const last = await prisma.user.findFirst({ orderBy: { id: "desc" } });
    const nextId = last ? last.id + 1 : 1;
    const now = new Date();
    await prisma.user.create({
      data: {
        id: nextId,
        login: "admin",
        passwordHash: HASH,
        role: "admin",
        createdAt: now,
        updatedAt: now
      }
    });
    const curCounter = await prisma.counter.findUnique({ where: { key: "users" } });
    const seq = Math.max(nextId, curCounter?.seq ?? 0);
    await prisma.counter.upsert({
      where: { key: "users" },
      create: { key: "users", seq },
      update: { seq }
    });
    console.log(
      `Создан пользователь admin (id=${nextId}), пароль admin123. Проверьте DATABASE_URL — это та база, куда пишет API.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
