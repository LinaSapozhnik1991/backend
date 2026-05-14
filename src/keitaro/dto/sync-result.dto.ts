/** Счётчики одной фазы синхронизации (лендинги или офферы) */
export interface SyncPhaseStatsDto {
  added: number;
  updated: number;
  skipped: number;
}

/** Результат синхронизации Keitaro → landings (лендинги + офферы) */
export interface SyncResultDto {
  landings: SyncPhaseStatsDto;
  offers: SyncPhaseStatsDto;
  /** Предупреждения и некритичные ошибки (синхронизация продолжалась) */
  warnings: string[];
}
