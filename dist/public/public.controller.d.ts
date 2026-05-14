import { CatalogService } from "../catalog/catalog.service";
import { PrismaService } from "../database/prisma.service";
export declare class PublicController {
    private readonly prisma;
    private readonly catalog;
    constructor(prisma: PrismaService, catalog: CatalogService);
    config(landingIdRaw: string): Promise<Record<string, unknown> | {
        landing: {
            id: number;
            name: string;
            status: string;
            created_at: Date | null;
            updated_at: Date | null;
        };
        widgets: {
            widget_key: string;
            widget_name: string;
            is_enabled: boolean;
            sort_order: number;
        }[];
        scripts: {
            script_key: string;
            script_name: string;
            is_enabled: boolean;
            sort_order: number;
        }[];
        settings: Record<string, string>;
    }>;
}
