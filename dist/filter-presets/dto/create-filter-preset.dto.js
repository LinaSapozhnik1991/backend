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
exports.CreateFilterPresetDto = exports.FilterPresetRuleBodyDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const filter_presets_constants_1 = require("../filter-presets.constants");
const OPS = [
    "contains",
    "not_contains",
    "equals",
    "not_equals",
    "starts_with",
    "ends_with",
    "regex_matches",
    "regex_not_matches"
];
class FilterPresetRuleBodyDto {
}
exports.FilterPresetRuleBodyDto = FilterPresetRuleBodyDto;
__decorate([
    (0, class_validator_1.IsIn)(["name", "id", "group"]),
    __metadata("design:type", String)
], FilterPresetRuleBodyDto.prototype, "field", void 0);
__decorate([
    (0, class_validator_1.IsIn)([...OPS]),
    __metadata("design:type", Object)
], FilterPresetRuleBodyDto.prototype, "op", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => String(value ?? "").trim()),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: "Значение условия не может быть пустым" }),
    __metadata("design:type", String)
], FilterPresetRuleBodyDto.prototype, "value", void 0);
class CreateFilterPresetDto {
}
exports.CreateFilterPresetDto = CreateFilterPresetDto;
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => String(value ?? "").trim()),
    (0, class_validator_1.IsIn)([...filter_presets_constants_1.FILTER_PRESET_CONTEXTS_WITH_GLOBAL], { message: "Недопустимый контекст фильтра" }),
    __metadata("design:type", Object)
], CreateFilterPresetDto.prototype, "context", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => String(value ?? "").trim()),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1, { message: "Введите название шаблона" }),
    (0, class_validator_1.MaxLength)(100, { message: "Название не длиннее 100 символов" }),
    __metadata("design:type", String)
], CreateFilterPresetDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: "rules должен быть массивом" }),
    (0, class_validator_1.ArrayMinSize)(1, { message: "Нужен хотя бы один фильтр" }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FilterPresetRuleBodyDto),
    __metadata("design:type", Array)
], CreateFilterPresetDto.prototype, "rules", void 0);
//# sourceMappingURL=create-filter-preset.dto.js.map