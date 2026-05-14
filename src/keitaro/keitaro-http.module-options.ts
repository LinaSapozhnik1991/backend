import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { HttpModuleOptions } from "@nestjs/axios";
import type { AgentOptions } from "node:https";
import * as https from "node:https";
import { KEITARO_HTTP_USER_AGENT } from "./keitaro-http.constants";

const log = new Logger("KeitaroHttp");

/**
 * Параметры axios для запросов к Keitaro: IPv4 (часто нужно на Windows при битом IPv6),
 * свой https.Agent (keepAlive, опционально отключение проверки сертификата),
 * proxy: false — не использовать HTTP(S)_PROXY из окружения (частая причина обрыва TLS к внешнему хосту).
 */
export function createKeitaroHttpModuleOptions(cfg: ConfigService): HttpModuleOptions {
  const useIpv4 = String(cfg.get("KEITARO_HTTPS_USE_IPV4") ?? "true").toLowerCase() !== "false";
  const tlsVerify =
    String(cfg.get("KEITARO_TLS_REJECT_UNAUTHORIZED") ?? "true").toLowerCase() !== "false";
  const minTls = (cfg.get<string>("KEITARO_TLS_MIN_VERSION") ?? "TLSv1.2").trim();

  if (!tlsVerify) {
    log.warn(
      "KEITARO_TLS_REJECT_UNAUTHORIZED=false — проверка TLS-сертификата Keitaro отключена (только для отладки / доверенного трекера)."
    );
  }

  const agentOpts: AgentOptions = {
    keepAlive: true,
    rejectUnauthorized: tlsVerify,
    ...(minTls.length > 0 ? { minVersion: minTls as AgentOptions["minVersion"] } : {})
  };
  const httpsAgent = new https.Agent(agentOpts);

  return {
    timeout: 120_000,
    maxRedirects: 5,
    /** Иначе axios подхватывает HTTP_PROXY/HTTPS_PROXY и может «ломать» исходящий HTTPS к трекеру. */
    proxy: false,
    headers: {
      "User-Agent": KEITARO_HTTP_USER_AGENT,
      Accept: "application/json"
    },
    httpsAgent,
    ...(useIpv4 ? { family: 4 as const } : {})
  };
}
