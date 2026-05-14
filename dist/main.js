"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const cfg = app.get(config_1.ConfigService);
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false
    }));
    const raw = process.env.CORS_ALLOW_ORIGIN ??
        cfg.get("CORS_ALLOW_ORIGIN") ??
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
    console.log(`CRM API (Nest) http://127.0.0.1:${port}/api  (GET /api/health — проверка без JWT)`);
}
void bootstrap();
//# sourceMappingURL=main.js.map