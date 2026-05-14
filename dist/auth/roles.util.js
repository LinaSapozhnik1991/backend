"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferUserRole = inferUserRole;
exports.hasLandingsFullAccess = hasLandingsFullAccess;
function inferUserRole(user) {
    if (user.role === "admin")
        return "admin";
    if (user.role === "manager")
        return "manager";
    if (user.login === "admin")
        return "admin";
    return "editor";
}
function hasLandingsFullAccess(role) {
    return role === "admin" || role === "manager";
}
//# sourceMappingURL=roles.util.js.map