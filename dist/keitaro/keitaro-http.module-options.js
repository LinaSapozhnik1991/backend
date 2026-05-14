"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createKeitaroHttpModuleOptions = createKeitaroHttpModuleOptions;
const common_1 = require("@nestjs/common");
const https = __importStar(require("node:https"));
const keitaro_http_constants_1 = require("./keitaro-http.constants");
const log = new common_1.Logger("KeitaroHttp");
function createKeitaroHttpModuleOptions(cfg) {
    const useIpv4 = String(cfg.get("KEITARO_HTTPS_USE_IPV4") ?? "true").toLowerCase() !== "false";
    const tlsVerify = String(cfg.get("KEITARO_TLS_REJECT_UNAUTHORIZED") ?? "true").toLowerCase() !== "false";
    const minTls = (cfg.get("KEITARO_TLS_MIN_VERSION") ?? "TLSv1.2").trim();
    if (!tlsVerify) {
        log.warn("KEITARO_TLS_REJECT_UNAUTHORIZED=false — проверка TLS-сертификата Keitaro отключена (только для отладки / доверенного трекера).");
    }
    const agentOpts = {
        keepAlive: true,
        rejectUnauthorized: tlsVerify,
        ...(minTls.length > 0 ? { minVersion: minTls } : {})
    };
    const httpsAgent = new https.Agent(agentOpts);
    return {
        timeout: 120_000,
        maxRedirects: 5,
        proxy: false,
        headers: {
            "User-Agent": keitaro_http_constants_1.KEITARO_HTTP_USER_AGENT,
            Accept: "application/json"
        },
        httpsAgent,
        ...(useIpv4 ? { family: 4 } : {})
    };
}
//# sourceMappingURL=keitaro-http.module-options.js.map