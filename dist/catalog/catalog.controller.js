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
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const auth_guard_1 = require("../auth/auth.guard");
const catalog_service_1 = require("./catalog.service");
const put_catalog_dto_1 = require("./dto/put-catalog.dto");
let CatalogController = class CatalogController {
    constructor(catalog) {
        this.catalog = catalog;
    }
    async listWidgets() {
        const items = await this.catalog.listWidgets();
        return { items };
    }
    async putWidgets(body) {
        const items = await this.catalog.replaceWidgets(body.items);
        return { items };
    }
    async listScripts() {
        const items = await this.catalog.listScripts();
        return { items };
    }
    async putScripts(body) {
        const items = await this.catalog.replaceScripts(body.items);
        return { items };
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, common_1.Get)("widgets"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "listWidgets", null);
__decorate([
    (0, common_1.Put)("widgets"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [put_catalog_dto_1.PutCatalogDto]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "putWidgets", null);
__decorate([
    (0, common_1.Get)("scripts"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "listScripts", null);
__decorate([
    (0, common_1.Put)("scripts"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [put_catalog_dto_1.PutCatalogDto]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "putScripts", null);
exports.CatalogController = CatalogController = __decorate([
    (0, common_1.Controller)("catalog"),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], CatalogController);
//# sourceMappingURL=catalog.controller.js.map