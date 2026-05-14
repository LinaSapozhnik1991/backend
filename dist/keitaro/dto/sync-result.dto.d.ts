export interface SyncPhaseStatsDto {
    added: number;
    updated: number;
    skipped: number;
}
export interface SyncResultDto {
    landings: SyncPhaseStatsDto;
    offers: SyncPhaseStatsDto;
    warnings: string[];
}
