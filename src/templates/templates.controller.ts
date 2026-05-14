import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import type { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { canonicalTemplateKey } from "../common/template-key.util";
import { PrismaService } from "../database/prisma.service";

const CRM_TEMPLATE_MAX_BYTES = 2 * 1024 * 1024;

/** Приводим тело шаблона к Buffer (в т.ч. после чтения из Postgres BYTEA). */
function templateBodyToBuffer(body: unknown): Buffer {
  if (body == null) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof body === "object") {
    const withValue = body as { value?: () => unknown };
    if (typeof withValue.value === "function") {
      try {
        const v = withValue.value();
        if (Buffer.isBuffer(v)) return v;
        if (v instanceof Uint8Array) return Buffer.from(v);
      } catch {
        /* ignore */
      }
    }
    const inner = (body as { buffer?: unknown }).buffer;
    if (Buffer.isBuffer(inner)) return inner;
    if (inner instanceof ArrayBuffer) return Buffer.from(new Uint8Array(inner));
    if (inner instanceof Uint8Array) return Buffer.from(inner);
  }
  return Buffer.alloc(0);
}

@Controller("templates")
@UseGuards(AuthGuard)
export class TemplatesController {
  constructor(private readonly prisma: PrismaService) {}

  private validateEntity(entity: string): asserts entity is "widgets" | "scripts" {
    if (entity !== "widgets" && entity !== "scripts") {
      throw new BadRequestException({ error: "Некорректный тип шаблона" });
    }
  }

  private validateKey(key: string): string {
    const decoded = decodeURIComponent(key);
    const c = canonicalTemplateKey(decoded);
    if (!/^[a-z0-9_-]{1,100}$/.test(c)) {
      const shown = decoded.length > 120 ? `${decoded.slice(0, 120)}…` : decoded;
      throw new BadRequestException({
        error: `Некорректный ключ шаблона «${shown}» (нормализация: «${c}»).`,
        template_key: shown,
        template_key_canonical: c
      });
    }
    return c;
  }

  @Get(":entity/:templateKey/file")
  async downloadFile(
    @Param("entity") entity: string,
    @Param("templateKey") templateKey: string,
    @Res() res: Response
  ): Promise<void> {
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

  @Get(":entity/:templateKey")
  async meta(@Param("entity") entity: string, @Param("templateKey") templateKey: string) {
    this.validateEntity(entity);
    const k = this.validateKey(templateKey);
    const row = await this.prisma.entityTemplate.findUnique({
      where: { entity_templateKey: { entity, templateKey: k } },
      select: { body: true, originalFilename: true, mimeType: true }
    });
    if (!row) throw new NotFoundException({ error: "Шаблон не найден" });
    const buf = templateBodyToBuffer(row.body);
    const sizeBytes = buf.length;
    const mime = row.mimeType && row.mimeType !== "" ? row.mimeType : "application/octet-stream";
    const orig =
      row.originalFilename && row.originalFilename !== "" ? row.originalFilename : null;
    /** Ручной ввод через PUT: без имени файла и text/plain — отдаём UTF-8 в JSON для редактора. */
    const manualText = orig == null && mime.toLowerCase().includes("text/plain");
    const body_text = manualText ? buf.toString("utf8") : null;
    return {
      size_bytes: sizeBytes,
      original_filename: orig,
      mime_type: mime,
      body_text
    };
  }

  @Put(":entity/:templateKey")
  async putBody(
    @Param("entity") entity: string,
    @Param("templateKey") templateKey: string,
    @Body() body: { body?: string }
  ) {
    this.validateEntity(entity);
    const k = this.validateKey(templateKey);
    const text = String(body.body ?? "");
    if (text.length > CRM_TEMPLATE_MAX_BYTES) {
      throw new BadRequestException({ error: "Тело шаблона не более 2 МБ" });
    }
    await this.saveTemplate(entity as "widgets" | "scripts", k, Buffer.from(text, "utf8"), null, "text/plain; charset=UTF-8");
    return { success: true };
  }

  @Delete(":entity/:templateKey")
  async del(@Param("entity") entity: string, @Param("templateKey") templateKey: string) {
    this.validateEntity(entity);
    const k = this.validateKey(templateKey);
    await this.prisma.entityTemplate.deleteMany({
      where: { entity, templateKey: k }
    });
    return { success: true };
  }

  @Post(":entity/:templateKey/upload")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: CRM_TEMPLATE_MAX_BYTES }
    })
  )
  async upload(
    @Param("entity") entity: string,
    @Param("templateKey") templateKey: string,
    @UploadedFile() file?: Express.Multer.File
  ) {
    this.validateEntity(entity);
    const k = this.validateKey(templateKey);
    if (!file) throw new BadRequestException({ error: "Ожидается поле file" });
    const raw = file.buffer;
    if (!raw || raw.length > CRM_TEMPLATE_MAX_BYTES) {
      throw new BadRequestException({ error: "Файл не более 2 МБ" });
    }
    const mime = file.mimetype && file.mimetype !== "" ? file.mimetype : "application/octet-stream";
    const orig = file.originalname ? file.originalname.slice(0, 255) : null;
    await this.saveTemplate(entity as "widgets" | "scripts", k, raw, orig, mime);
    return {
      size_bytes: raw.length,
      original_filename: orig,
      mime_type: mime,
      body_text: null
    };
  }

  private async saveTemplate(
    entity: "widgets" | "scripts",
    k: string,
    body: Buffer,
    originalFilename: string | null,
    mimeType: string | null
  ): Promise<void> {
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

  private safeFilename(name: string): string {
    let base = name.replace(/\0|\//g, "").split(/[/\\]/).pop() ?? "";
    if (!base) base = "template.bin";
    return base.replace(/[^a-zA-Z0-9._-]+/g, "_") || "template.bin";
  }
}
