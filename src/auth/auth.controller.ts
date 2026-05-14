import { Body, Controller, Get, Headers, Post, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService
  ) {}

  @Get()
  authInfo(@Headers("accept") accept: string | undefined, @Res() res: Response): void {
    if (accept && accept.includes("text/html")) {
      const allowed = String(this.config.get("CORS_ALLOW_ORIGIN") ?? "http://localhost:5173")
        .split(",")
        .map((s) => s.trim());
      let loginOrigin = allowed[0] ?? "http://localhost:5173";
      for (const o of allowed) {
        if (o.includes("localhost") || o.includes("127.0.0.1")) {
          loginOrigin = o;
          break;
        }
      }
      const loginUrl = `${loginOrigin.replace(/\/$/, "")}/login`;
      res.type("html").send(
        `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Вход в CRM</title></head><body style="font-family:system-ui,sans-serif;max-width:36rem;margin:2rem auto;padding:0 1rem">
<h1>Это адрес API, а не страница входа</h1>
<p>Авторизация выполняется запросом <strong>POST</strong> с JSON. Откройте админку и войдите через форму.</p>
<p><a href="${loginUrl}">Перейти к странице входа</a></p>
</body></html>`
      );
      return;
    }
    res.json({
      info: "Вход только через POST (JSON: login, password). Откройте админку и форму «Войти»."
    });
  }

  @Post()
  async login(@Body() body: { login?: string; password?: string }) {
    return this.auth.login(String(body.login ?? ""), String(body.password ?? ""));
  }
}
