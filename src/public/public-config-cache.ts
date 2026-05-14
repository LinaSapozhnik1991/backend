/** Кеш ответа GET /api/public/config (см. PublicController). */
const publicConfigCache = new Map<number, { expires: number; payload: Record<string, unknown> }>();

export const PUBLIC_CONFIG_TTL_MS = 60_000;

export function getPublicConfigCache(): Map<number, { expires: number; payload: Record<string, unknown> }> {
  return publicConfigCache;
}

export function clearPublicConfigCache(): void {
  publicConfigCache.clear();
}
