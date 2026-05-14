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
exports.TemplatesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const auth_guard_1 = require("../auth/auth.guard");
const template_key_util_1 = require("../common/template-key.util");
const prisma_service_1 = require("../database/prisma.service");
const CRM_TEMPLATE_MAX_BYTES = 2 * 1024 * 1024;
function templateBodyToBuffer(body) {
    if (body == null)
        return Buffer.alloc(0);
    if (Buffer.isBuffer(body))
        return body;
    if (body instanceof Uint8Array)
        return Buffer.from(body);
    if (typeof body === "object") {
        const withValue = body;
        if (typeof withValue.value === "function") {
            try {
                const v = withValue.value();
                if (Buffer.isBuffer(v))
                    return v;
                if (v instanceof Uint8Array)
                    return Buffer.from(v);
            }
            catch {
            }
        }
        const inner = body.buffer;
        if (Buffer.isBuffer(inner))
            return inner;
        if (inner instanceof ArrayBuffer)
            return Buffer.from(new Uint8Array(inner));
        if (inner instanceof Uint8Array)
            return Buffer.from(inner);
    }
    return Buffer.alloc(0);
}
let TemplatesController = class TemplatesController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    validateEntity(entity) {
        if (entity !== "widgets" && entity !== "scripts") {
            throw new common_1.BadRequestException({ error: "Некорректный тип шаблона" });
        }
    }
    validateKey(key) {
        const decoded = decodeURIComponent(key);
        const c = (0, template_key_util_1.canonicalTemplateKey)(decoded);
        if (!/^[a-z0-9_-]{1,100}$/.test(c)) {
            const shown = decoded.length > 120 ? `${decoded.slice(0, 120)}…` : decoded;
            throw new common_1.BadRequestException({
                error: `Некорректный ключ шаблона «${shown}» (нормализация: «${c}»).`,
                template_key: shown,
                template_key_canonical: c
            });
        }
        return c;
    }
    async downloadFile(entity, templateKey, res) {
        this.validateEntity(entity);
        const k = this.validateKey(templateKey);
        const row = await this.prisma.entityTemplate.findUnique({
            where: { entity_templateKey: { entity, templateKey: k } }
        });
        if (!row) {
            res.status(404).type("text/plain; charset=utf-8").send("Шаблон не найден");
            return;
        }
        const blob = templateBodyToBuffer(row.body);
        const mime = row.mimeType && row.mimeType !== "" ? row.mimeType : "application/octet-stream";
        const fn = row.originalFilename && row.originalFilename !== "" ? row.originalFilename : `${entity}_${k}`;
        const safeName = this.safeFilename(fn);
        res.setHeader("Content-Type", mime);
        res.setHeader("Content-Length", String(blob.length));
        res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
        res.send(blob);
    }
    async meta(entity, templateKey) {
        this.validateEntity(entity);
        const k = this.validateKey(templateKey);
        const row = await this.prisma.entityTemplate.findUnique({
            where: { entity_templateKey: { entity, templateKey: k } },
            select: { body: true, originalFilename: true, mimeType: true }
        });
        if (!row)
            throw new common_1.NotFoundException({ error: "Шаблон не найден" });
        const buf = templateBodyToBuffer(row.body);
        const sizeBytes = buf.length;
        const mime = row.mimeType && row.mimeType !== "" ? row.mimeType : "application/octet-stream";
        const orig = row.originalFilename && row.originalFilename !== "" ? row.originalFilename : null;
        const manualText = orig == null && mime.toLowerCase().includes("text/plain");
        const body_text = manualText ? buf.toString("utf8") : null;
        return {
            size_bytes: sizeBytes,
            original_filename: orig,
            mime_type: mime,
            body_text
        };
    }
    async putBody(entity, templateKey, body) {
        this.validateEntity(entity);
        const k = this.validateKey(templateKey);
        const text = String(body.body ?? "");
        if (text.length > CRM_TEMPLATE_MAX_BYTES) {
            throw new common_1.BadRequestException({ error: "Тело шаблона не более 2 МБ" });
        }
        await this.saveTemplate(entity, k, Buffer.from(text, "utf8"), null, "text/plain; charset=UTF-8");
        return { success: true };
    }
    async del(entity, templateKey) {
        this.validateEntity(entity);
        const k = this.validateKey(templateKey);
        await this.prisma.entityTemplate.deleteMany({
            where: { entity, templateKey: k }
        });
        return { success: true };
    }
    async upload(entity, templateKey, file) {
        this.validateEntity(entity);
        const k = this.validateKey(templateKey);
        if (!file)
            throw new common_1.BadRequestException({ error: "Ожидается поле file" });
        const raw = file.buffer;
        if (!raw || raw.length > CRM_TEMPLATE_MAX_BYTES) {
            throw new common_1.BadRequestException({ error: "Файл не более 2 МБ" });
        }
        const mime = file.mimetype && file.mimetype !== "" ? file.mimetype : "application/octet-stream";
        const orig = file.originalname ? file.originalname.slice(0, 255) : null;
        await this.saveTemplate(entity, k, raw, orig, mime);
        return {
            size_bytes: raw.length,
            original_filename: orig,
            mime_type: mime,
            body_text: null
        };
    }
    async saveTemplate(entity, k, body, originalFilename, mimeType) {
        const bodyBytes = new Uint8Array(body);
        await this.prisma.entityTemplate.upsert({
            where: { entity_templateKey: { entity, templateKey: k } },
            create: {
                entity,
                templateKey: k,
                body: bodyBytes,
                originalFilename,
                mimeType
            },
            update: {
                body: bodyBytes,
                originalFilename,
                mimeType
            }
        });
    }
    safeFilename(name) {
        let base = name.replace(/\0|\//g, "").split(/[/\\]/).pop() ?? "";
        if (!base)
            base = "template.bin";
        return base.replace(/[^a-zA-Z0-9._-]+/g, "_") || "template.bin";
    }
};
exports.TemplatesController = TemplatesController;
__decorate([
    (0, common_1.Get)(":entity/:templateKey/file"),
    __param(0, (0, common_1.Param)("entity")),
    __param(1, (0, common_1.Param)("templateKey")),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "downloadFile", null);
__decorate([
    (0, common_1.Get)(":entity/:templateKey"),
    __param(0, (0, common_1.Param)("entity")),
    __param(1, (0, common_1.Param)("templateKey")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "meta", null);
__decorate([
    (0, common_1.Put)(":entity/:templateKey"),
    __param(0, (0, common_1.Param)("entity")),
    __param(1, (0, common_1.Param)("templateKey")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "putBody", null);
__decorate([
    (0, common_1.Delete)(":entity/:templateKey"),
    __param(0, (0, common_1.Param)("entity")),
    __param(1, (0, common_1.Param)("templateKey")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "del", null);
__decorate([
    (0, common_1.Post)(":entity/:templateKey/upload"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file", {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: CRM_TEMPLATE_MAX_BYTES }
    })),
    __param(0, (0, common_1.Param)("entity")),
    __param(1, (0, common_1.Param)("templateKey")),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "upload", null);
exports.TemplatesController = TemplatesController = __decorate([
    (0, common_1.Controller)("templates"),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TemplatesController);
//# sourceMappingURL=templates.controller.js.map