export declare const FILTER_PRESET_CONTEXTS: readonly ["landings-list", "landings-widgets", "landings-scripts", "offers-list", "offers-widgets", "offers-scripts", "landings-template-widgets", "landings-template-scripts", "offers-template-widgets", "offers-template-scripts"];
export declare const FILTER_PRESET_GLOBAL_CONTEXT: "shared-filter-templates";
export declare const FILTER_PRESET_CONTEXTS_WITH_GLOBAL: readonly ["landings-list", "landings-widgets", "landings-scripts", "offers-list", "offers-widgets", "offers-scripts", "landings-template-widgets", "landings-template-scripts", "offers-template-widgets", "offers-template-scripts", "shared-filter-templates"];
export type FilterPresetContext = (typeof FILTER_PRESET_CONTEXTS_WITH_GLOBAL)[number];
export declare function isAllowedFilterPresetContext(v: string): v is FilterPresetContext;
