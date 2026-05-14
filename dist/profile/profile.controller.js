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
exports.ProfileController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../auth/auth.guard");
const roles_util_1 = require("../auth/roles.util");
const current_user_decorator_1 = require("../common/current-user.decorator");
const prisma_service_1 = require("../database/prisma.service");
const users_service_1 = require("../users/users.service");
let ProfileController = class ProfileController {
    constructor(prisma, usersService) {
        this.prisma = prisma;
        this.usersService = usersService;
    }
    async getProfile(actor) {
        const row = await this.prisma.user.findUnique({ where: { id: actor.id } });
        if (!row)
            throw new common_1.NotFoundException({ error: "Пользователь не найден" });
        return {
            user: {
                id: row.id,
                login: row.login,
                role: (0, roles_util_1.inferUserRole)(row),
                created_at: row.createdAt
            }
        };
    }
    async patchPassword(actor, body) {
        await this.usersService.changePassword(actor.id, String(body.current_password ?? ""), String(body.new_password ?? ""));
        return { ok: true };
    }
};
exports.ProfileController = ProfileController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)(),
    (0, common_1.Put)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "patchPassword", null);
exports.ProfileController = ProfileController = __decorate([
    (0, common_1.Controller)("profile"),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService])
], ProfileController);
//# sourceMappingURL=profile.controller.js.map