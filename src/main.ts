import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const cfg = app.get(ConfigService);
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false
    })
  );

  const raw =
    process.env.CORS_ALLOW_ORIGIN ??
    cfg.get<string>("CORS_ALLOW_ORIGIN") ??
    "http://localhost:5173";
  const origins = String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  app.enableCors({
    origin: origins.length > 0 ? origins : true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    maxAge: 86400
  });

  const port = +(process.env.PORT ?? "3000");
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`CRM API (Nest) http://127.0.0.1:${port}/api  (GET /api/health — проверка без JWT)`);
}

void bootstrap();
