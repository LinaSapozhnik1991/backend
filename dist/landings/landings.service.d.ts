import type { JwtUser } from "../auth/jwt.util";
import { CatalogService } from "../catalog/catalog.service";
import { CounterService } from "../database/counter.service";
import { PrismaService } from "../database/prisma.service";
type LandingRowForApi = {
    id: number;
    name: string;
    groupName: string;
    recordType: string;
    status: string;
    roi: unknown;
    conversion: unknown;
    cr: unknown;
    crc: unknown;
    createdAt: Date | null;
    updatedAt: Date | null;
    keitaroId?: number | null;
    groupId?: number | null;
    state?: string | null;
    localPath?: string | null;
    previewPath?: string | null;
    landingType?: string | null;
};
export type RecordScope = "landing" | "offer";
export interface ToggleDto {
    id?: number;
    key: string;
    name: string;
    is_enabled?: boolean;
    sort_order?: number;
}
export interface SettingDto {
    key: string;
    value: string;
}
export interface SaveLandingBody {
    name?: string;
    group_name?: string;
    record_type?: string;
    status?: string;
    widgets?: ToggleDto[];
    scripts?: ToggleDto[];
    settings?: SettingDto[];
}
type LandingLean = LandingRowForApi;
export declare class LandingsService {
    private readonly prisma;
    private readonly catalog;
    private readonly counter;
    constructor(prisma: PrismaService, catalog: CatalogService, counter: CounterService);
    assertOfferLandingAccess(user: JwtUser, recordType: string): void;
    assertRecordMatchesScope(scope: RecordScope, recordType: string): void;
    list(scope: RecordScope, user: JwtUser): Promise<Record<string, unknown>[]>;
    serializeLandingRow(l: LandingLean): Record<string, unknown>;
    getDetails(landingId: number): Promise<Record<string, unknown>>;
    getOne(scope: RecordScope, user: JwtUser, id: number): Promise<Record<string, unknown>>;
    create(scope: RecordScope, user: JwtUser, body: SaveLandingBody): Promise<Record<string, unknown>>;
    clone(scope: RecordScope, user: JwtUser, cloneId: number): Promise<Record<string, unknown>>;
    update(scope: RecordScope, user: JwtUser, id: number, body: SaveLandingBody): Promise<Record<string, unknown>>;
    remove(scope: RecordScope, user: JwtUser, id: number): Promise<{
        success: boolean;
    }>;
    private createLandingEntity;
    private updateLandingEntity;
    private syncWidgets;
    private syncScripts;
    private syncSettings;
    private addHistoryRow;
    private createDiffHistory;
    private diffToggleList;
    private diffSettings;
}
export {};
