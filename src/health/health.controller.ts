import { Controller, Get } from "@nestjs/common";

/** Публичная проверка «API жив» без авторизации (отладка прокси / порта). */
@Controller("health")
export class HealthController {
  @Get()
  ping(): { ok: true; service: string; ts: number } {
    return { ok: true, service: "crm-api", ts: Date.now() };
  }
}
