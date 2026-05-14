/** Ключи вкладок/экранов на фронте (куда сохраняли раньше). */
export const FILTER_PRESET_CONTEXTS = [
  "landings-list",
  "landings-widgets",
  "landings-scripts",
  "offers-list",
  "offers-widgets",
  "offers-scripts",
  "landings-template-widgets",
  "landings-template-scripts",
  "offers-template-widgets",
  "offers-template-scripts"
] as const;

/** Все новые шаблоны пишутся сюда; список API отдаёт объединение этого ключа и legacy-ключей выше. */
export const FILTER_PRESET_GLOBAL_CONTEXT = "shared-filter-templates" as const;

export const FILTER_PRESET_CONTEXTS_WITH_GLOBAL = [
  ...FILTER_PRESET_CONTEXTS,
  FILTER_PRESET_GLOBAL_CONTEXT
] as const;

export type FilterPresetContext = (typeof FILTER_PRESET_CONTEXTS_WITH_GLOBAL)[number];

export function isAllowedFilterPresetContext(v: string): v is FilterPresetContext {
  return (FILTER_PRESET_CONTEXTS_WITH_GLOBAL as readonly string[]).includes(v);
}
