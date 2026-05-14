import { PrismaService } from "../database/prisma.service";
export type CatalogItemDto = {
    key: string;
    name: string;
};
export declare class CatalogService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listWidgets(): Promise<CatalogItemDto[]>;
    listScripts(): Promise<CatalogItemDto[]>;
    replaceWidgets(items: CatalogItemDto[]): Promise<CatalogItemDto[]>;
    replaceScripts(items: CatalogItemDto[]): Promise<CatalogItemDto[]>;
    mergedWidgetsForLanding(landingId: number): Promise<Array<{
        id: number;
        key: string;
        name: string;
        is_enabled: boolean;
        sort_order: number;
    }>>;
    mergedScriptsForLanding(landingId: number): Promise<Array<{
        id: number;
        key: string;
        name: string;
        is_enabled: boolean;
        sort_order: number;
    }>>;
    private dedupe;
}
