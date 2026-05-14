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
exports.FilterPresetsController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../auth/auth.guard");
const roles_util_1 = require("../auth/roles.util");
const current_user_decorator_1 = require("../common/current-user.decorator");
const create_filter_preset_dto_1 = require("./dto/create-filter-preset.dto");
const filter_presets_service_1 = require("./filter-presets.service");
let FilterPresetsController = class FilterPresetsController {
    constructor(filterPresets) {
        this.filterPresets = filterPresets;
    }
    async list(context) {
        const c = String(context ?? "").trim();
        if (!c) {
            throw new common_1.BadRequestException({ error: "Укажите параметр context" });
        }
        const presets = await this.filterPresets.list(c);
        return { presets };
    }
    async create(body) {
        const preset = await this.filterPresets.create(body);
        return { preset };
    }
    async remove(id, user) {
        if (!(0, roles_util_1.hasLandingsFullAccess)(user.role)) {
            throw new common_1.ForbiddenException({
                error: "Удалять шаблоны фильтров могут только администратор и менеджер."
            });
        }
        await this.filterPresets.delete(id);
        return { ok: true };
    }
};
exports.FilterPresetsController = FilterPresetsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)("context")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilterPresetsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_filter_preset_dto_1.CreateFilterPresetDto]),
    __metadata("design:returntype", Promise)
], FilterPresetsController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id", common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], FilterPresetsController.prototype, "remove", null);
exports.FilterPresetsController = FilterPresetsController = __decorate([
    (0, common_1.Controller)("filter-presets"),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [filter_presets_service_1.FilterPresetsService])
], FilterPresetsController);
//# sourceMappingURL=filter-presets.controller.js.map