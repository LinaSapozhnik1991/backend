import { CounterService } from "../database/counter.service";
import { PrismaService } from "../database/prisma.service";
import type { CreateFilterPresetDto } from "./dto/create-filter-preset.dto";
export type FilterPresetRuleDto = {
    field: string;
    op: string;
    value: string;
};
export type FilterPresetResponseDto = {
    id: number;
    name: string;
    rules: FilterPresetRuleDto[];
    created_at: string;
    saved_from_context?: string;
};
export declare class FilterPresetsService {
    private readonly prisma;
    private readonly counters;
    constructor(prisma: PrismaService, counters: CounterService);
    private assertContext;
    list(context: string): Promise<FilterPresetResponseDto[]>;
    create(body: CreateFilterPresetDto): Promise<FilterPresetResponseDto>;
    delete(presetId: number): Promise<void>;
}
