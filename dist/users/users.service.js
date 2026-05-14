"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const jwt_util_1 = require("../auth/jwt.util");
const roles_util_1 = require("../auth/roles.util");
const counter_service_1 = require("../database/counter.service");
const prisma_service_1 = require("../database/prisma.service");
let UsersService = class UsersService {
    constructor(prisma, counter) {
        this.prisma = prisma;
        this.counter = counter;
    }
    async list() {
        const rows = await this.prisma.user.findMany({ orderBy: { id: "asc" } });
        return rows.map((r) => ({
            id: r.id,
            login: r.login,
            role: (0, roles_util_1.inferUserRole)(r),
            created_at: r.createdAt
        }));
    }
    async getOne(id) {
        const row = await this.prisma.user.findUnique({ where: { id } });
        if (!row)
            throw new common_1.NotFoundException({ error: "Пользователь не найден" });
        return {
            id: row.id,
            login: row.login,
            role: (0, roles_util_1.inferUserRole)(row),
            created_at: row.createdAt
        };
    }
    async create(body) {
        const login = String(body.login ?? "").trim();
        if (login === "" || login.length > 100) {
            throw new common_1.UnprocessableEntityException({ error: "Логин обязателен (до 100 символов)" });
        }
        const role = String(body.role ?? "editor");
        if (!["admin", "editor", "manager"].includes(role)) {
            throw new common_1.UnprocessableEntityException({ error: "Недопустимая роль" });
        }
        const exists = await this.prisma.user.findUnique({ where: { login } });
        if (exists)
            throw new common_1.ConflictException({ error: "Пользователь с таким логином уже есть" });
        let plain = String(body.password ?? "");
        let temp;
        if (plain === "") {
            const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
            temp = "";
            for (let i = 0; i < 14; i++)
                temp += chars[Math.floor(Math.random() * chars.length)];
            plain = temp;
        }
        if (plain.length < 8) {
            throw new common_1.UnprocessableEntityException({
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
        const out = {
            user: { id: uid, login, role }
        };
        if (temp !== undefined)
            out.temporary_password = temp;
        return out;
    }
    async updateRole(id, body, actor, jwtSecret) {
        const newRole = String(body.role ?? "");
        if (!["admin", "editor", "manager"].includes(newRole)) {
            throw new common_1.UnprocessableEntityException({ error: "Недопустимая роль" });
        }
        const target = await this.prisma.user.findUnique({ where: { id } });
        if (!target)
            throw new common_1.NotFoundException({ error: "Пользователь не найден" });
        const currentRole = (0, roles_util_1.inferUserRole)(target);
        if (currentRole === "admin" && newRole !== "admin") {
            const cnt = await this.prisma.user.count({ where: { role: "admin" } });
            if (cnt <= 1) {
                throw new common_1.BadRequestException({ error: "Нельзя снять роль администратора с последнего администратора" });
            }
        }
        await this.prisma.user.update({ where: { id }, data: { role: newRole } });
        const out = {
            user: { id, login: target.login, role: newRole }
        };
        if (id === actor.id) {
            out.token = (0, jwt_util_1.signAccessToken)({ id, login: target.login, role: newRole }, jwtSecret);
        }
        return out;
    }
    async remove(id, actor) {
        if (id === actor.id) {
            throw new common_1.BadRequestException({ error: "Нельзя удалить собственную учётную запись" });
        }
        const target = await this.prisma.user.findUnique({ where: { id } });
        if (!target)
            throw new common_1.NotFoundException({ error: "Пользователь не найден" });
        const targetRole = (0, roles_util_1.inferUserRole)(target);
        if (targetRole === "admin") {
            const cnt = await this.prisma.user.count({ where: { role: "admin" } });
            if (cnt <= 1) {
                throw new common_1.BadRequestException({ error: "Нельзя удалить последнего администратора" });
            }
        }
        await this.prisma.historyEntry.deleteMany({ where: { userId: id } });
        await this.prisma.user.delete({ where: { id } });
        return { ok: true };
    }
    async changePassword(actorId, current, next) {
        if (current === "" || next.length < 8) {
            throw new common_1.UnprocessableEntityException({
                error: "Укажите текущий пароль и новый пароль (не короче 8 символов)."
            });
        }
        const u = await this.prisma.user.findUnique({ where: { id: actorId } });
        if (!u)
            throw new common_1.NotFoundException({ error: "Пользователь не найден" });
        const ok = await bcrypt.compare(current, u.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException({ error: "Неверный текущий пароль" });
        const hash = await bcrypt.hash(next, 10);
        await this.prisma.user.update({ where: { id: actorId }, data: { passwordHash: hash } });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        counter_service_1.CounterService])
], UsersService);
//# sourceMappingURL=users.service.js.map