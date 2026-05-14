import type { JwtUser } from "../auth/jwt.util";
import { CreateFilterPresetDto } from "./dto/create-filter-preset.dto";
import { FilterPresetsService } from "./filter-presets.service";
export declare class FilterPresetsController {
    private readonly filterPresets;
    constructor(filterPresets: FilterPresetsService);
    list(context: string): Promise<{
        presets: import("./filter-presets.service").FilterPresetResponseDto[];
    }>;
    create(body: CreateFilterPresetDto): Promise<{
        preset: import("./filter-presets.service").FilterPresetResponseDto;
    }>;
    remove(id: number, user: JwtUser): Promise<{
        ok: boolean;
    }>;
}
