import { FILTER_PRESET_CONTEXTS_WITH_GLOBAL } from "../filter-presets.constants";
declare const OPS: readonly ["contains", "not_contains", "equals", "not_equals", "starts_with", "ends_with", "regex_matches", "regex_not_matches"];
export declare class FilterPresetRuleBodyDto {
    field: "name" | "id" | "group";
    op: (typeof OPS)[number];
    value: string;
}
export declare class CreateFilterPresetDto {
    context: (typeof FILTER_PRESET_CONTEXTS_WITH_GLOBAL)[number];
    name: string;
    rules: FilterPresetRuleBodyDto[];
}
export {};
