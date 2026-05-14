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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_util_1 = require("./jwt.util");
let AuthGuard = class AuthGuard {
    constructor(config) {
        this.config = config;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const disabled = String(this.config.get("DISABLE_AUTH") ?? "false").toLowerCase() === "true";
        if (disabled) {
            req.user = { id: 1, login: "dev_admin", role: "admin" };
            return true;
        }
        const raw = req.headers.authorization ?? req.headers.Authorization;
        const token = raw?.startsWith("Bearer ") ? raw.slice(7).trim() : null;
        const secret = this.config.get("JWT_SECRET") || "dev_secret";
        const payload = token ? (0, jwt_util_1.verifyAccessToken)(token, secret) : null;
        if (!payload) {
            throw new common_1.UnauthorizedException({ error: "Не авторизован" });
        }
        req.user = payload;
        return true;
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map