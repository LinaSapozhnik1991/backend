import { Transform, Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsIn, IsString, MaxLength, MinLength, ValidateNested } from "class-validator";
import { FILTER_PRESET_CONTEXTS_WITH_GLOBAL } from "../filter-presets.constants";

const OPS = [
  "contains",
  "not_contains",
  "equals",
  "not_equals",
  "starts_with",
  "ends_with",
  "regex_matches",
  "regex_not_matches"
] as const;

export class FilterPresetRuleBodyDto {
  @IsIn(["name", "id", "group"])
  field!: "name" | "id" | "group";

  @IsIn([...OPS])
  op!: (typeof OPS)[number];

  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  @MinLength(1, { message: "Значение условия не может быть пустым" })
  value!: string;
}

export class CreateFilterPresetDto {
  @Transform(({ value }) => String(value ?? "").trim())
  @IsIn([...FILTER_PRESET_CONTEXTS_WITH_GLOBAL], { message: "Недопустимый контекст фильтра" })
  context!: (typeof FILTER_PRESET_CONTEXTS_WITH_GLOBAL)[number];

  @Transform(({ value }) => String(value ?? "").trim())
  @IsString()
  @MinLength(1, { message: "Введите название шаблона" })
  @MaxLength(100, { message: "Название не длиннее 100 символов" })
  name!: string;

  @IsArray({ message: "rules должен быть массивом" })
  @ArrayMinSize(1, { message: "Нужен хотя бы один фильтр" })
  @ValidateNested({ each: true })
  @Type(() => FilterPresetRuleBodyDto)
  rules!: FilterPresetRuleBodyDto[];
}
