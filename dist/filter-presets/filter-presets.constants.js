"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILTER_PRESET_CONTEXTS_WITH_GLOBAL = exports.FILTER_PRESET_GLOBAL_CONTEXT = exports.FILTER_PRESET_CONTEXTS = void 0;
exports.isAllowedFilterPresetContext = isAllowedFilterPresetContext;
exports.FILTER_PRESET_CONTEXTS = [
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
];
exports.FILTER_PRESET_GLOBAL_CONTEXT = "shared-filter-templates";
exports.FILTER_PRESET_CONTEXTS_WITH_GLOBAL = [
    ...exports.FILTER_PRESET_CONTEXTS,
    exports.FILTER_PRESET_GLOBAL_CONTEXT
];
function isAllowedFilterPresetContext(v) {
    return exports.FILTER_PRESET_CONTEXTS_WITH_GLOBAL.includes(v);
}
//# sourceMappingURL=filter-presets.constants.js.map