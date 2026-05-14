"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
let AuthController = class AuthController {
    constructor(auth, config) {
        this.auth = auth;
        this.config = config;
    }
    authInfo(accept, res) {
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
            res.type("html").send(`<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Вход в CRM</title></head><body style="font-family:system-ui,sans-serif;max-width:36rem;margin:2rem auto;padding:0 1rem">
<h1>Это адрес API, а не страница входа</h1>
<p>Авторизация выполняется запросом <strong>POST</strong> с JSON. Откройте админку и войдите через форму.</p>
<p><a href="${loginUrl}">Перейти к странице входа</a></p>
</body></html>`);
            return;
        }
        res.json({
            info: "Вход только через POST (JSON: login, password). Откройте админку и форму «Войти»."
        });
    }
    async login(body) {
        return this.auth.login(String(body.login ?? ""), String(body.password ?? ""));
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)("accept")),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "authInfo", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map