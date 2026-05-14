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
exports.PutCatalogDto = exports.PutCatalogItemDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class PutCatalogItemDto {
}
exports.PutCatalogItemDto = PutCatalogItemDto;
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => String(value ?? "").trim()),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: "Ключ не может быть пустым" }),
    __metadata("design:type", String)
], PutCatalogItemDto.prototype, "key", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => String(value ?? "").trim()),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: "Название не может быть пустым" }),
    __metadata("design:type", String)
], PutCatalogItemDto.prototype, "name", void 0);
class PutCatalogDto {
}
exports.PutCatalogDto = PutCatalogDto;
__decorate([
    (0, class_validator_1.IsArray)({ message: "Поле items должно быть массивом" }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PutCatalogItemDto),
    __metadata("design:type", Array)
], PutCatalogDto.prototype, "items", void 0);
//# sourceMappingURL=put-catalog.dto.js.map