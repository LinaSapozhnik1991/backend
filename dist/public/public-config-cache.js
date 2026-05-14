"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLIC_CONFIG_TTL_MS = void 0;
exports.getPublicConfigCache = getPublicConfigCache;
exports.clearPublicConfigCache = clearPublicConfigCache;
const publicConfigCache = new Map();
exports.PUBLIC_CONFIG_TTL_MS = 60_000;
function getPublicConfigCache() {
    return publicConfigCache;
}
function clearPublicConfigCache() {
    publicConfigCache.clear();
}
//# sourceMappingURL=public-config-cache.js.map