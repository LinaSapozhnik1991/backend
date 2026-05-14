import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CounterService } from "../database/counter.service";
import { PrismaService } from "../database/prisma.service";
import {
  FILTER_PRESET_GLOBAL_CONTEXT,
  isAllowedFilterPresetContext
} from "./filter-presets.constants";
import type { CreateFilterPresetDto } from "./dto/create-filter-preset.dto";

const MAX_PRESETS_PER_CONTEXT = 40;

export type FilterPresetRuleDto = { field: string; op: string; value: string };

export type FilterPresetResponseDto = {
  id: number;
  name: string;
  rules: FilterPresetRuleDto[];
  created_at: string;
  /** Откуда сохранён шаблон (вкладка/экран); для старых записей совпадает с прежним context в БД. */
  saved_from_context?: string;
};

@Injectable()
export class FilterPresetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly counters: CounterService
  ) {}

  private assertContext(context: string): void {
    if (!isAllowedFilterPresetContext(context)) {
      throw new BadRequestException({ error: "Недопустимый контекст фильтра" });
    }
  }

  async list(context: string): Promise<FilterPresetResponseDto[]> {
    const ctx = String(context ?? "").trim();
    this.assertContext(ctx);
    /** Пресеты по вкладке: legacy `context = ctx` или общий пул с `saved_from_context = ctx`. */
    const rows = await this.prisma.filterPreset.findMany({
      where: {
        OR: [{ context: ctx }, { context: FILTER_PRESET_GLOBAL_CONTEXT, savedFromContext: ctx }]
      },
      orderBy: { createdAt: "desc" },
      take: 200
    });
    return rows.map((row) => {
      const rulesRaw = row.rules;
      const rules: FilterPresetRuleDto[] = Array.isArray(rulesRaw)
        ? rulesRaw.map((r) => {
            const o = r as Record<string, unknown>;
            return {
              field: String(o.field ?? "name"),
              op: String(o.op ?? "contains"),
              value: String(o.value ?? "")
            };
          })
        : [];
      const storedContext = row.context;
      const savedFrom =
        row.savedFromContext && row.savedFromContext.trim() !== ""
          ? row.savedFromContext
          : storedContext !== FILTER_PRESET_GLOBAL_CONTEXT
            ? storedContext
            : undefined;
      const out: FilterPresetResponseDto = {
        id: row.id,
        name: row.name,
        rules,
        created_at: row.createdAt.toISOString()
      };
      if (savedFrom) {
        out.saved_from_context = savedFrom;
      }
      return out;
    });
  }

  async create(body: CreateFilterPresetDto): Promise<FilterPresetResponseDto> {
    const scope = String(body.context ?? "").trim();
    if (!isAllowedFilterPresetContext(scope)) {
      throw new BadRequestException({ error: "Недопустимый контекст фильтра" });
    }
    const cleaned = body.rules.map((r) => ({
      field: r.field,
      op: r.op,
      value: r.value.trim()
    }));
    if (cleaned.length === 0) {
      throw new BadRequestException({ error: "Добавьте хотя бы одно условие с непустым значением" });
    }
    const storeContext = FILTER_PRESET_GLOBAL_CONTEXT;
    const n = await this.prisma.filterPreset.count({ where: { context: storeContext } });
    if (n >= MAX_PRESETS_PER_CONTEXT) {
      throw new BadRequestException({
        error: `Не больше ${MAX_PRESETS_PER_CONTEXT} общих шаблонов (создайте место, удалив старые)`
      });
    }
    const id = await this.counters.next("filter_preset");
    const row = await this.prisma.filterPreset.create({
      data: {
        id,
        context: storeContext,
        name: body.name.trim(),
        rules: cleaned as unknown as Prisma.InputJsonValue,
        savedFromContext: scope
      }
    });
    return {
      id: row.id,
      name: row.name,
      rules: row.rules as FilterPresetRuleDto[],
      created_at: row.createdAt.toISOString(),
      saved_from_context: scope
    };
  }

  async delete(presetId: number): Promise<void> {
    const res = await this.prisma.filterPreset.deleteMany({ where: { id: presetId } });
    if (res.count === 0) {
      throw new NotFoundException({ error: "Шаблон не найден" });
    }
  }
}
